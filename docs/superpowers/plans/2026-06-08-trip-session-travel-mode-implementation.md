# Trip Session Travel Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Trip Session travel mode so the app can attach transactions to trips, switch into an active trip context, and show trip-aware dashboard and transaction views without breaking existing data.

**Architecture:** Extend the existing shared-ledger IndexedDB schema with a `trips` collection, optional `trip_id` transaction fields, and a persisted `active_trip_id` app setting. Keep trip logic centralized in the typed service/composable layer, then layer a lightweight trips route, shell switcher, trip-aware form fields, and dashboard/transaction selectors on top of the current route structure.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Dexie.js, Vitest, existing Bun/Vite scripts, current app-specific app-data service/composable pattern.

---

## File Structure

- Modify `src/types/app-data.ts`: add `TripSession`, transaction `trip_id`, `TripDraft`, `TripStatus`, and `CombinedTransaction.trip_id`.
- Modify `src/db/database.ts`: add Dexie `trips` table, version bump, and seed `active_trip_id` compatibility through settings.
- Modify `src/lib/backup.ts`: validate `trips` and tolerate older payloads without it.
- Modify `src/lib/backup.test.ts`: cover trip payload validation and legacy import compatibility.
- Create `src/lib/trips.ts`: pure helpers for trip summaries, date-range day buckets, and active-trip filtering.
- Create `src/lib/trips.test.ts`: unit tests for daily breakdown and transaction filtering.
- Modify `src/services/appDataService.ts`: load/save trips, persist active trip setting, attach `trip_id` on transaction create/update, and include trips in replace-all restore.
- Modify `src/services/appDataService.test.ts`: cover trip-aware create/update operations.
- Modify `src/composables/useAppData.ts`: expose `trips`, `activeTripId`, `activeTrip`, trip-aware selectors, and trip CRUD methods.
- Modify `src/router/index.ts`: add `/trips`.
- Modify `src/components/AppShell.vue`: add trip switcher UI on desktop/mobile navigation shell.
- Modify `src/components/transactions/TransactionForm.vue`: add optional trip selector/defaulting behavior.
- Modify `src/views/DashboardView.vue`: switch between normal and trip dashboard modes.
- Modify `src/views/TransactionsView.vue`: add trip filter and respect active trip context.
- Create `src/views/TripsView.vue`: lightweight trip management page.

## Component And Data Boundaries

- `src/lib/trips.ts`: only pure functions. No Dexie or Vue imports.
- `src/services/appDataService.ts`: only persistence logic and record-shaping. No UI decisions.
- `src/composables/useAppData.ts`: the single place that maps raw stored data into UI-facing trip selectors.
- `src/views/TripsView.vue`: owns trip CRUD form state and uses composable actions.
- `src/components/AppShell.vue`: only switches active trip context and displays current state.
- `src/components/transactions/TransactionForm.vue`: accepts trip options and emits trip-aware drafts without needing persistence knowledge.

## Tasks

### Task 1: Trip Types, Pure Helpers, And Backup Compatibility

**Files:**
- Create: `src/lib/trips.ts`
- Test: `src/lib/trips.test.ts`
- Modify: `src/types/app-data.ts`
- Modify: `src/lib/backup.ts`
- Test: `src/lib/backup.test.ts`

- [ ] **Step 1: Write the failing trip helper tests**

```ts
import { describe, expect, test } from 'vitest'

import { buildTripDailyBreakdown, filterTransactionsByTrip } from './trips'

describe('buildTripDailyBreakdown', () => {
  test('returns every trip day including empty days', () => {
    const days = buildTripDailyBreakdown(
      { start_date: Date.UTC(2026, 5, 20), end_date: Date.UTC(2026, 5, 22) },
      [{ id: 'expense-1', kind: 'expense', amount: 120, date: Date.UTC(2026, 5, 20), category_id: 'expense-food', name: '牛肉麵' }],
    )

    expect(days).toHaveLength(3)
    expect(days[1]?.total).toBe(0)
  })
})

describe('filterTransactionsByTrip', () => {
  test('keeps only transactions matching the selected trip id', () => {
    const result = filterTransactionsByTrip(
      [
        { id: 'expense-1', kind: 'expense', trip_id: 'trip-tw', category_id: 'expense-food', name: '早餐', amount: 50, date: Date.UTC(2026, 5, 20) },
        { id: 'expense-2', kind: 'expense', trip_id: undefined, category_id: 'expense-food', name: '晚餐', amount: 80, date: Date.UTC(2026, 5, 20) },
      ],
      'trip-tw',
    )

    expect(result.map((item) => item.id)).toEqual(['expense-1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test:unit -- --run src/lib/trips.test.ts src/lib/backup.test.ts`
Expected: FAIL with module or export errors for `./trips`, and existing backup tests still pass before new trip coverage is added.

- [ ] **Step 3: Extend app-data types with trip records and trip-aware drafts**

```ts
export type TripStatus = 'planned' | 'active' | 'completed'

export interface TripSession {
  trip_id: string
  name: string
  destination: string
  start_date: number
  end_date: number
  budget_amount: number
  budget_currency: SupportedCurrency
  status: TripStatus
  notes: string
  created_at: number
  updated_at: number
}

export interface TripDraft {
  name: string
  destination: string
  start_date: number
  end_date: number
  budget_amount: number
  budget_currency: SupportedCurrency
  status: TripStatus
  notes: string
}
```

- [ ] **Step 4: Add trip-aware transaction fields and payload support**

```ts
export interface AppDataPayload {
  cycles: BudgetCycle[]
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  expenses: ExpenseTransaction[]
  incomes: IncomeTransaction[]
  targetExpenses: TargetExpenseLimit[]
  savings: SavingRecord[]
  settings: AppSetting[]
  trips?: TripSession[]
  fxRates?: FxRateRecord[]
}

export interface ExpenseDraft {
  category_id: string
  name: string
  amount: number
  date: number
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
  trip_id?: string
}
```

- [ ] **Step 5: Implement pure trip helper functions**

```ts
export function filterTransactionsByTrip(
  transactions: readonly CombinedTransaction[],
  tripId?: string,
): CombinedTransaction[] {
  if (!tripId) {
    return [...transactions]
  }

  return transactions.filter((transaction) => transaction.trip_id === tripId)
}

export function buildTripDailyBreakdown(
  trip: Pick<TripSession, 'start_date' | 'end_date'>,
  transactions: readonly CombinedTransaction[],
): TripDaySummary[] {
  const days: TripDaySummary[] = []

  for (let cursor = startOfDay(trip.start_date); cursor <= startOfDay(trip.end_date); cursor += 86_400_000) {
    const items = transactions.filter((transaction) => startOfDay(transaction.date) === cursor)
    days.push({ date: cursor, total: items.reduce((sum, item) => sum + item.amount, 0), count: items.length, items })
  }

  return days
}
```

- [ ] **Step 6: Expand backup validation for trips and legacy payload fallback**

```ts
const arrayKeys: Array<Exclude<keyof AppDataPayload, 'trips' | 'fxRates'>> = [
  'cycles',
  'expenseCategories',
  'incomeCategories',
  'expenses',
  'incomes',
  'targetExpenses',
  'savings',
  'settings',
]

const trips = Array.isArray(_payload.trips) ? _payload.trips : []
trips.forEach((trip, index) => {
  requireString(trip, 'trip_id', `trips[${index}]`, errors)
  requireNumber(trip, 'start_date', `trips[${index}]`, errors)
  requireNumber(trip, 'end_date', `trips[${index}]`, errors)
})
```

- [ ] **Step 7: Add backup tests for trips and old backups**

```ts
test('accepts a payload with trips', () => {
  const result = validateAppDataPayload({
    ...validPayload,
    trips: [
      {
        trip_id: 'trip-tw',
        name: '台灣 3日2夜',
        destination: 'Taiwan',
        start_date: Date.UTC(2026, 5, 20),
        end_date: Date.UTC(2026, 5, 22),
        budget_amount: 5000,
        budget_currency: 'HKD',
        status: 'planned',
        notes: '',
        created_at: Date.UTC(2026, 5, 1),
        updated_at: Date.UTC(2026, 5, 1),
      },
    ],
  })

  expect(result.ok).toBe(true)
})

test('accepts a legacy payload without trips by treating it as empty', () => {
  const result = validateAppDataPayload(validPayload)
  expect(result.ok).toBe(true)
})
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `bun run test:unit -- --run src/lib/trips.test.ts src/lib/backup.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/types/app-data.ts src/lib/trips.ts src/lib/trips.test.ts src/lib/backup.ts src/lib/backup.test.ts
git commit -m "feat: add trip types and validation helpers"
```

### Task 2: Dexie Schema And Trip-Aware Persistence

**Files:**
- Modify: `src/db/database.ts`
- Modify: `src/services/appDataService.ts`
- Test: `src/services/appDataService.test.ts`

- [ ] **Step 1: Write failing service tests for trip-aware transaction persistence**

```ts
test('creates an expense with trip_id when provided', async () => {
  await createExpense({
    category_id: 'expense-food',
    name: '牛肉麵',
    amount: 80,
    date: Date.UTC(2026, 5, 20),
    currency_code: 'TWD',
    exchange_rate_hkd: 0.24,
    trip_id: 'trip-tw',
  })

  expect(mockExpenseAdd.mock.calls[0]?.[0]).toMatchObject({
    trip_id: 'trip-tw',
  })
})

test('updates a saving and preserves trip_id', async () => {
  await updateSaving('saving-1', {
    category_id: 'saving-cash',
    name: '旅費預留',
    amount: 500,
    date: Date.UTC(2026, 5, 19),
    currency_code: 'HKD',
    exchange_rate_hkd: 1,
    trip_id: 'trip-tw',
  })

  expect(mockSavingUpdate).toHaveBeenCalledWith(
    'saving-1',
    expect.objectContaining({ trip_id: 'trip-tw' }),
  )
})
```

- [ ] **Step 2: Run the service tests to verify failure**

Run: `bun run test:unit -- --run src/services/appDataService.test.ts`
Expected: FAIL because `trip_id` is not yet written by create/update functions.

- [ ] **Step 3: Add the `trips` table and bump the Dexie version**

```ts
export class ExpenseTrackerDatabase extends Dexie {
  trips!: Table<TripSession, string>

  constructor() {
    super('personal-expense-tracker')

    this.version(3).stores({
      cycles: 'cycle_id, cycle_code',
      expenseCategories: 'category_id, name_en, deleted',
      incomeCategories: 'category_id, name_en, deleted',
      expenses: 'transaction_id, category_id, date, trip_id',
      incomes: 'transaction_id, category_id, date, trip_id',
      targetExpenses: 'target_expense_id, cycle_id, category_id, [cycle_id+category_id]',
      savings: 'saving_id, date, category_id',
      settings: 'setting_id, name',
      trips: 'trip_id, status, start_date, end_date',
      fxRates: 'rate_id, currency_code, source_date, fetched_at',
    })
  }
}
```

- [ ] **Step 4: Load, restore, and seed trip-aware payloads**

```ts
const [cycles, expenseCategories, incomeCategories, expenses, incomes, targetExpenses, savings, settings, trips, fxRates] =
  await Promise.all([
    db.cycles.toArray(),
    db.expenseCategories.toArray(),
    db.incomeCategories.toArray(),
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.targetExpenses.toArray(),
    db.savings.toArray(),
    db.settings.toArray(),
    db.trips.toArray(),
    db.fxRates.toArray(),
  ])

return {
  cycles,
  expenseCategories,
  incomeCategories,
  expenses,
  incomes,
  targetExpenses,
  savings,
  settings,
  trips,
  fxRates,
}
```

- [ ] **Step 5: Persist trip ids on create/update and add trip CRUD helpers**

```ts
export async function createTrip(draft: TripDraft): Promise<void> {
  const now = Date.now()
  await db.trips.add({
    trip_id: makeId('trip'),
    ...draft,
    notes: draft.notes.trim(),
    created_at: now,
    updated_at: now,
  })
}

export async function setActiveTrip(tripId?: string): Promise<void> {
  await db.settings.put({
    setting_id: 'setting-active-trip',
    name: 'active_trip_id',
    parameter: tripId ?? '',
  })
}
```

- [ ] **Step 6: Extend create/update transaction functions with `trip_id`**

```ts
const transaction: ExpenseTransaction = {
  transaction_id: makeId('expense'),
  category_id: draft.category_id,
  name: draft.name.trim(),
  amount: convertToHkd(draft.amount, draft.exchange_rate_hkd),
  date: draft.date,
  create_date: now,
  edit_date: now,
  synced: false,
  trip_id: draft.trip_id,
  original_currency: draft.currency_code,
  original_amount: draft.amount,
  exchange_rate_hkd: draft.exchange_rate_hkd,
}
```

- [ ] **Step 7: Run the service tests again**

Run: `bun run test:unit -- --run src/services/appDataService.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/db/database.ts src/services/appDataService.ts src/services/appDataService.test.ts
git commit -m "feat: persist trips and trip-linked transactions"
```

### Task 3: Composable Selectors And Active Trip State

**Files:**
- Modify: `src/composables/useAppData.ts`
- Test: `src/lib/trips.test.ts`

- [ ] **Step 1: Add a failing selector test for trip totals**

```ts
test('computes trip remaining budget from linked transactions', () => {
  const total = getTripRemainingBudget(
    { budget_amount: 5000 },
    [
      { id: 'expense-1', kind: 'expense', amount: 1200, date: Date.UTC(2026, 5, 20), category_id: 'expense-food', name: '午餐', trip_id: 'trip-tw' },
      { id: 'income-1', kind: 'income', amount: 300, date: Date.UTC(2026, 5, 21), category_id: 'income-other', name: '退款', trip_id: 'trip-tw' },
    ],
  )

  expect(total).toBe(4100)
})
```

- [ ] **Step 2: Run the targeted test to verify failure**

Run: `bun run test:unit -- --run src/lib/trips.test.ts`
Expected: FAIL because `getTripRemainingBudget` does not exist yet.

- [ ] **Step 3: Add trip selectors to the composable**

```ts
const trips = computed(() => (data.value.trips ?? []).slice().sort((a, b) => a.start_date - b.start_date))
const activeTripId = computed(() => data.value.settings.find((setting) => setting.name === 'active_trip_id')?.parameter || '')
const activeTrip = computed(() => trips.value.find((trip) => trip.trip_id === activeTripId.value))
const tripTransactions = computed(() => filterTransactionsByTrip(combinedTransactions.value, activeTripId.value || undefined))
const tripSpentTotal = computed(() =>
  tripTransactions.value
    .filter((transaction) => transaction.kind !== 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0),
)
```

- [ ] **Step 4: Expose trip CRUD and context-switch actions**

```ts
return {
  trips,
  activeTripId,
  activeTrip,
  tripTransactions,
  tripSpentTotal,
  tripDailyBreakdown,
  addTrip: (draft: TripDraft) => withRefresh(() => createTrip(draft)),
  updateTrip: (tripId: string, draft: TripDraft) => withRefresh(() => updateTrip(tripId, draft)),
  completeTrip: (tripId: string) => withRefresh(() => updateTripStatus(tripId, 'completed')),
  setActiveTrip: (tripId?: string) => withRefresh(() => saveActiveTripSetting(tripId)),
}
```

- [ ] **Step 5: Implement the missing pure selector helpers**

```ts
export function getTripRemainingBudget(
  trip: Pick<TripSession, 'budget_amount'>,
  transactions: readonly CombinedTransaction[],
): number {
  const income = transactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
  const spend = transactions.filter((item) => item.kind !== 'income').reduce((sum, item) => sum + item.amount, 0)
  return trip.budget_amount + income - spend
}
```

- [ ] **Step 6: Re-run selector tests**

Run: `bun run test:unit -- --run src/lib/trips.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/composables/useAppData.ts src/lib/trips.ts src/lib/trips.test.ts
git commit -m "feat: add active trip selectors and actions"
```

### Task 4: Trips Route And Shell Context Switching

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/components/AppShell.vue`
- Create: `src/views/TripsView.vue`

- [ ] **Step 1: Add the route and shell nav entry**

```ts
import TripsView from '@/views/TripsView.vue'

{ path: '/trips', name: 'trips', component: TripsView }
```

```ts
const navItems = [
  { label: '總覽', to: '/', icon: LayoutDashboard },
  { label: '旅程', to: '/trips', icon: PlaneTakeoff },
  { label: '交易', to: '/transactions', icon: ListChecks },
]
```

- [ ] **Step 2: Build the trip switcher UI in `AppShell.vue`**

```vue
<label class="grid gap-1 text-sm font-medium text-stone-700">
  <span>旅遊模式</span>
  <select :value="activeTripId" class="rounded-md border border-stone-300 bg-white px-3 py-2" @change="onTripChange">
    <option value="">日常模式</option>
    <option v-for="trip in trips" :key="trip.trip_id" :value="trip.trip_id">
      {{ trip.name }}
    </option>
  </select>
</label>
```

- [ ] **Step 3: Create the Trips management view**

```vue
<script setup lang="ts">
const appData = useAppData()
const draft = reactive({
  name: '',
  destination: '',
  start_date: toDateInputValue(Date.now()),
  end_date: toDateInputValue(Date.now()),
  budget_amount: 0,
  budget_currency: 'HKD' as const,
  status: 'planned' as const,
  notes: '',
})
</script>
```

- [ ] **Step 4: Add create/edit/complete interactions**

```ts
async function submitTrip(): Promise<void> {
  await appData.addTrip({
    name: draft.name,
    destination: draft.destination,
    start_date: fromDateInputValue(draft.start_date),
    end_date: fromDateInputValue(draft.end_date),
    budget_amount: Number(draft.budget_amount),
    budget_currency: draft.budget_currency,
    status: draft.status,
    notes: draft.notes,
  })
}
```

- [ ] **Step 5: Run type-check**

Run: `bun run type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/router/index.ts src/components/AppShell.vue src/views/TripsView.vue
git commit -m "feat: add trips management and shell switcher"
```

### Task 5: Trip-Aware Transaction Form And Transactions View

**Files:**
- Modify: `src/components/transactions/TransactionForm.vue`
- Modify: `src/views/TransactionsView.vue`

- [ ] **Step 1: Extend the form props and draft payload**

```ts
const props = defineProps<{
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  trips?: readonly TripSession[]
  defaultTripId?: string
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate?: string
  compact?: boolean
  transaction?: CombinedTransaction
}>()

const form = reactive({
  kind: 'expense' as TransactionKind,
  category_id: '',
  name: '',
  amount: 0,
  currency_code: 'HKD' as SupportedCurrency,
  date: toDateInputValue(Date.now()),
  trip_id: props.defaultTripId ?? '',
})
```

- [ ] **Step 2: Add the trip selector field to the template**

```vue
<label class="grid gap-1 text-sm font-medium text-stone-700">
  所屬旅程
  <select v-model="form.trip_id" class="rounded-md border border-stone-300 bg-white px-3 py-2">
    <option value="">不屬於旅程</option>
    <option v-for="trip in props.trips ?? []" :key="trip.trip_id" :value="trip.trip_id">
      {{ trip.name }}
    </option>
  </select>
</label>
```

- [ ] **Step 3: Emit `trip_id` in create/update drafts**

```ts
const draft = {
  category_id: form.category_id,
  name: form.name,
  amount: Number(form.amount),
  date: fromDateInputValue(form.date),
  currency_code: form.currency_code,
  exchange_rate_hkd: selectedRate.value,
  trip_id: form.trip_id || undefined,
}
```

- [ ] **Step 4: Add trip filtering to `TransactionsView.vue`**

```ts
const filters = reactive({
  kind: 'all' as 'all' | 'expense' | 'income' | 'saving',
  categoryId: 'all',
  tripId: appData.activeTripId.value || 'all',
  datePreset: 'all' as 'all' | 'today' | 'cycle' | 'future',
  fromDate: '',
  toDate: '',
})

if (filters.tripId !== 'all') {
  if (filters.tripId === 'unassigned' && transaction.trip_id) {
    return false
  }
  if (filters.tripId !== 'unassigned' && transaction.trip_id !== filters.tripId) {
    return false
  }
}
```

- [ ] **Step 5: Keep the global active trip and local page filter distinct**

```ts
watch(
  () => appData.activeTripId.value,
  (tripId) => {
    filters.tripId = tripId || 'all'
  },
  { immediate: true },
)
```

- [ ] **Step 6: Run type-check**

Run: `bun run type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/transactions/TransactionForm.vue src/views/TransactionsView.vue
git commit -m "feat: add trip assignment and transaction filtering"
```

### Task 6: Trip Dashboard Mode And Final Verification

**Files:**
- Modify: `src/views/DashboardView.vue`
- Modify: `src/components/AppShell.vue`

- [ ] **Step 1: Branch the dashboard into normal and trip modes**

```vue
<template>
  <div v-if="appData.activeTrip.value" class="grid gap-6">
    <section class="grid gap-3 md:grid-cols-4">
      <MetricCard label="旅程預算" :value="formatCurrency(appData.activeTrip.value.budget_amount, appData.activeTrip.value.budget_currency)" />
      <MetricCard label="已用" :value="formatCurrency(appData.tripSpentTotal.value, appData.currency.value)" />
      <MetricCard label="剩餘" :value="formatCurrency(appData.tripRemainingBudget.value, appData.currency.value)" />
      <MetricCard label="每日可用" :value="formatCurrency(appData.tripAverageDailyBudget.value, appData.currency.value)" />
    </section>
  </div>
  <div v-else>
    <!-- keep existing dashboard -->
  </div>
</template>
```

- [ ] **Step 2: Render daily trip cards from the shared selector**

```vue
<section>
  <h2 class="text-lg font-semibold text-stone-950">每日支出</h2>
  <div class="mt-3 grid gap-3 md:grid-cols-3">
    <article v-for="day in appData.tripDailyBreakdown.value" :key="day.date" class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-semibold text-stone-950">{{ formatDate(day.date) }}</p>
      <p class="mt-1 text-2xl font-semibold text-stone-950">{{ formatCurrency(day.total, appData.currency.value) }}</p>
      <p class="mt-1 text-xs text-stone-500">{{ day.count }} 筆交易</p>
    </article>
  </div>
</section>
```

- [ ] **Step 3: Run the full automated verification**

Run: `bun run test:unit -- --run`
Expected: PASS

Run: `bun run type-check`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Manually verify the approved user flow**

Run: `bun run dev -- --host 127.0.0.1`
Expected: local dev server starts successfully.

Verify in browser:
- create one trip named `台灣 3日2夜`
- switch shell context from `日常模式` to the trip
- add one trip expense and one normal expense
- confirm dashboard changes only in trip mode
- confirm transactions filter can show `全部`, `未歸屬任何 trip`, and the trip
- confirm a legacy restore payload without `trips` still imports successfully

- [ ] **Step 5: Commit**

```bash
git add src/views/DashboardView.vue src/components/AppShell.vue
git commit -m "feat: add trip dashboard mode"
```

## Self-Review

- Spec coverage: trip CRUD, optional `trip_id` on all transaction types, active trip shell context, trip dashboard, transaction filtering, daily trip breakdown, completed trip support, and backup compatibility each map to at least one task above.
- Placeholder scan: there are no `TODO` placeholders or “handle appropriately” instructions without concrete files, code, or commands.
- Type consistency: the same names are used throughout the plan for `TripSession`, `TripDraft`, `TripStatus`, `trip_id`, `active_trip_id`, `tripDailyBreakdown`, and `tripRemainingBudget`.
