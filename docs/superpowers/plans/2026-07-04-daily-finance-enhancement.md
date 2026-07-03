# Daily Finance Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 7 daily-personal-finance features in separate TDD phases, keeping all data changes backward compatible.

**Architecture:** Each feature lives in a focused pure-function module under `src/lib/dailyFinance/`. `useAppData.ts` exposes the results as `computed` values. UI components only handle layout. Persistence changes are additive and optional.

**Tech Stack:** Vue 3 Composition API, TypeScript, Dexie.js, Vitest, Bun, Tailwind CSS v4, lucide-vue-next.

## Global Constraints

- All new data fields are optional; old backups import without migration.
- Dexie schema version bumps from 3 to 4 only to add the `savingChallenges` table.
- Tests are colocated with source as `*.test.ts`.
- Use `bun test:unit <path>` for single-file tests, `bun test:unit` for all tests, `bun run build` for type-check and production build.
- Run `bun lint` before each commit.
- Commit after each independently testable deliverable.
- Follow existing code style: semicolons off, single quotes, TypeScript `noUncheckedIndexedAccess` enabled.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/dailyFinance/safeToSpend.ts` | Calculate daily safe-to-spend amount |
| `src/lib/dailyFinance/safeToSpend.test.ts` | Tests for safe-to-spend |
| `src/lib/dailyFinance/recurringExpenses.ts` | Recurring expense detection and upcoming bills |
| `src/lib/dailyFinance/recurringExpenses.test.ts` | Tests for recurring expenses |
| `src/lib/dailyFinance/categoryAlerts.ts` | Category budget alert severity |
| `src/lib/dailyFinance/categoryAlerts.test.ts` | Tests for category alerts |
| `src/lib/dailyFinance/savingChallenges.ts` | Saving challenge progress and helpers |
| `src/lib/dailyFinance/savingChallenges.test.ts` | Tests for saving challenges |
| `src/lib/dailyFinance/weeklyReview.ts` | Last week review summary |
| `src/lib/dailyFinance/weeklyReview.test.ts` | Tests for weekly review |
| `src/lib/dailyFinance/quickAdd.ts` | Quick-add parsing and frequent transaction suggestions |
| `src/lib/dailyFinance/quickAdd.test.ts` | Tests for quick add |
| `src/lib/dailyFinance/monthlySnapshot.ts` | Monthly snapshot summary |
| `src/lib/dailyFinance/monthlySnapshot.test.ts` | Tests for monthly snapshot |
| `src/composables/useAppData.ts` | Expose new computed values and actions |
| `src/views/DashboardView.vue` | Integrate new dashboard cards/sections |
| `src/views/MonthlySnapshotView.vue` | New monthly snapshot view |
| `src/components/transactions/TransactionForm.vue` | Add recurring flag inputs |
| `src/components/dailyFinance/SafeToSpendCard.vue` | Safe-to-spend metric card |
| `src/components/dailyFinance/RecurringExpensesSummary.vue` | Fixed expenses and upcoming bills |
| `src/components/dailyFinance/CategoryAlertsList.vue` | Category budget progress bars |
| `src/components/dailyFinance/SavingChallengesList.vue` | Challenge progress cards |
| `src/components/dailyFinance/WeeklyReviewModal.vue` | Weekly review modal |
| `src/components/dailyFinance/QuickAddShortcuts.vue` | Shortcut chips and text parser |
| `src/types/app-data.ts` | Add optional fields and `SavingChallenge` type |
| `src/db/database.ts` | Add `savingChallenges` table, bump schema version |
| `src/services/appDataService.ts` | Add saving challenge CRUD and recurring flag persistence |
| `src/lib/backup.ts` | Allow optional `savingChallenges` in validation |
| `src/router/index.ts` | Add `/monthly-snapshot` route |
| `src/components/AppShell.vue` | Add monthly snapshot menu item |

---

### Task 1: Daily Safe-to-Spend

**Files:**
- Create: `src/lib/dailyFinance/safeToSpend.ts`
- Create: `src/lib/dailyFinance/safeToSpend.test.ts`
- Modify: `src/composables/useAppData.ts`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `remainingBudget`, `daysUntilNextIncome`, cycle expenses/savings, current cycle `saving_target` from `useAppData`.
- Produces: `getSafeToSpend(input: SafeToSpendInput): SafeToSpendResult`, exposed as `dailySafeToSpend` computed.

- [ ] **Step 1: Write the failing test**

Create `src/lib/dailyFinance/safeToSpend.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { getSafeToSpend } from './safeToSpend'

describe('getSafeToSpend', () => {
  test('distributes remaining budget evenly after committed expenses', () => {
    const result = getSafeToSpend({
      remainingBudget: 10000,
      daysUntilNextIncome: 10,
      fixedExpensesTotal: 3000,
      todaySpent: 200,
      savingTarget: 2000,
    })

    // available = 10000 - 3000 - 2000 = 5000
    // daily = 5000 / 10 = 500
    // safe today = 500 - 200 = 300
    expect(result.safeToSpendToday).toBe(300)
    expect(result.projectedSurplus).toBe(5000)
    expect(result.isOverToday).toBe(false)
  })

  test('flags overspend for today', () => {
    const result = getSafeToSpend({
      remainingBudget: 10000,
      daysUntilNextIncome: 10,
      fixedExpensesTotal: 3000,
      todaySpent: 600,
      savingTarget: 2000,
    })

    expect(result.safeToSpendToday).toBe(-100)
    expect(result.isOverToday).toBe(true)
  })

  test('returns zero when nothing is left', () => {
    const result = getSafeToSpend({
      remainingBudget: 1000,
      daysUntilNextIncome: 5,
      fixedExpensesTotal: 1000,
      todaySpent: 0,
      savingTarget: 0,
    })

    expect(result.safeToSpendToday).toBe(0)
    expect(result.projectedSurplus).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/safeToSpend.test.ts`

Expected: FAIL with `getSafeToSpend is not defined` or import error.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/dailyFinance/safeToSpend.ts`:

```ts
export interface SafeToSpendInput {
  remainingBudget: number
  daysUntilNextIncome: number
  fixedExpensesTotal: number
  todaySpent: number
  savingTarget: number
}

export interface SafeToSpendResult {
  safeToSpendToday: number
  projectedSurplus: number
  isOverToday: boolean
}

export function getSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const available = input.remainingBudget - input.fixedExpensesTotal - input.savingTarget
  const daily = Math.max(available, 0) / Math.max(input.daysUntilNextIncome, 1)
  const safeToSpendToday = daily - input.todaySpent

  return {
    safeToSpendToday,
    projectedSurplus: available,
    isOverToday: safeToSpendToday < 0,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/safeToSpend.test.ts`

Expected: PASS

- [ ] **Step 5: Wire into `useAppData.ts`**

Add to `useAppData`:

```ts
import { getSafeToSpend } from '@/lib/dailyFinance/safeToSpend'
import { startOfLocalDay } from '@/lib/date'
```

Add computed:

```ts
const todaySpent = computed(() => {
  const today = startOfLocalDay(new Date())
  return data.value.expenses
    .filter((expense) => startOfLocalDay(new Date(expense.date)) === today)
    .reduce((sum, expense) => sum + expense.amount, 0)
})

const dailySafeToSpend = computed(() => {
  const cycle = currentCycle.value
  if (!cycle) {
    return { safeToSpendToday: 0, projectedSurplus: 0, isOverToday: false }
  }

  return getSafeToSpend({
    remainingBudget: remainingBudget.value,
    daysUntilNextIncome: daysUntilNextIncome.value,
    fixedExpensesTotal: 0, // updated in Task 2
    todaySpent: todaySpent.value,
    savingTarget: cycle.saving_target,
  })
})
```

Expose in return object:

```ts
todaySpent,
dailySafeToSpend,
```

- [ ] **Step 6: Update `DashboardView.vue` metric**

Replace the "每日可用" `MetricCard`:

```vue
<MetricCard
  label="今日可用"
  :value="formatCurrency(appData.dailySafeToSpend.value.safeToSpendToday, appData.currency.value)"
  :detail="`今日已用 ${formatCurrency(appData.todaySpent.value, appData.currency.value)}`"
  :tone="appData.dailySafeToSpend.value.isOverToday ? 'warn' : 'good'"
/>
```

- [ ] **Step 7: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dailyFinance/safeToSpend.ts \
  src/lib/dailyFinance/safeToSpend.test.ts \
  src/composables/useAppData.ts \
  src/views/DashboardView.vue
git commit -m "feat: add daily safe-to-spend"
```

---

### Task 2: Recurring Expenses / Bills

**Files:**
- Modify: `src/types/app-data.ts`
- Modify: `src/lib/backup.ts`
- Create: `src/lib/dailyFinance/recurringExpenses.ts`
- Create: `src/lib/dailyFinance/recurringExpenses.test.ts`
- Modify: `src/services/appDataService.ts`
- Modify: `src/composables/useAppData.ts`
- Modify: `src/components/transactions/TransactionForm.vue`
- Create: `src/components/dailyFinance/RecurringExpensesSummary.vue`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `expenses`, `currentWindow`, `now`.
- Produces: `getRecurringExpenses(expenses)`, `getUpcomingBills(expenses, now, lookAheadDays)`, `getCycleFixedExpensesTotal(expenses, cycleWindow)`.

- [ ] **Step 1: Add optional recurring fields to types**

Modify `src/types/app-data.ts`:

```ts
export interface ExpenseTransaction {
  // ... existing fields
  recurring?: boolean
  recurring_frequency?: 'weekly' | 'monthly' | 'yearly'
  recurring_day?: number
}
```

- [ ] **Step 2: Update backup validation for optional fields**

Modify `src/lib/backup.ts`, add inside `payload.expenses.forEach`:

```ts
requireOptionalBoolean(transaction, 'recurring', `expenses[${index}]`, errors)
requireOptionalString(transaction, 'recurring_frequency', `expenses[${index}]`, errors)
requireOptionalNumber(transaction, 'recurring_day', `expenses[${index}]`, errors)
```

Add a helper if not present:

```ts
function requireOptionalBoolean(value: unknown, key: string, path: string, errors: string[]): void {
  if (isRecord(value) && value[key] !== undefined && typeof value[key] !== 'boolean') {
    errors.push(`${path}.${key} must be a boolean`)
  }
}
```

- [ ] **Step 3: Write the failing test**

Create `src/lib/dailyFinance/recurringExpenses.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { ExpenseTransaction } from '@/types/app-data'
import { getCycleFixedExpensesTotal, getRecurringExpenses, getUpcomingBills } from './recurringExpenses'

function expense(overrides: Partial<ExpenseTransaction> = {}): ExpenseTransaction {
  return {
    transaction_id: 'expense-1',
    category_id: 'expense-food',
    name: 'Rent',
    amount: 5000,
    date: new Date('2026-07-01').getTime(),
    create_date: Date.now(),
    edit_date: Date.now(),
    synced: false,
    ...overrides,
  }
}

describe('getRecurringExpenses', () => {
  test('returns only recurring expenses', () => {
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Rent', recurring: true, recurring_frequency: 'monthly', recurring_day: 1 }),
      expense({ name: 'Lunch', recurring: false }),
    ]

    const result = getRecurringExpenses(expenses)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Rent')
  })
})

describe('getCycleFixedExpensesTotal', () => {
  test('counts monthly recurring once per cycle', () => {
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Rent', recurring: true, recurring_frequency: 'monthly', recurring_day: 1, amount: 5000 }),
    ]

    const window = { start: new Date('2026-07-01').getTime(), end: new Date('2026-08-01').getTime(), label: '' }
    const result = getCycleFixedExpensesTotal(expenses, window)

    expect(result).toBe(5000)
  })
})

describe('getUpcomingBills', () => {
  test('lists monthly bill due within lookahead', () => {
    const now = new Date('2026-07-04').getTime()
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Netflix', recurring: true, recurring_frequency: 'monthly', recurring_day: 15, amount: 88 }),
    ]

    const result = getUpcomingBills(expenses, now, 14)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Netflix')
    expect(result[0]?.daysUntilDue).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/recurringExpenses.test.ts`

Expected: FAIL.

- [ ] **Step 5: Write minimal implementation**

Create `src/lib/dailyFinance/recurringExpenses.ts`:

```ts
import type { CycleWindow } from '@/lib/budgetCycle'
import type { ExpenseTransaction } from '@/types/app-data'

export interface RecurringExpense {
  transaction_id: string
  name: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  recurring_day: number
}

export interface UpcomingBill {
  transaction_id: string
  name: string
  amount: number
  dueTimestamp: number
  daysUntilDue: number
}

export function getRecurringExpenses(expenses: ExpenseTransaction[]): RecurringExpense[] {
  return expenses
    .filter((expense) => expense.recurring === true && expense.recurring_frequency && expense.recurring_day !== undefined)
    .map((expense) => ({
      transaction_id: expense.transaction_id,
      name: expense.name,
      amount: expense.amount,
      frequency: expense.recurring_frequency!,
      recurring_day: expense.recurring_day!,
    }))
}

export function getCycleFixedExpensesTotal(expenses: ExpenseTransaction[], cycleWindow: CycleWindow): number {
  const recurring = getRecurringExpenses(expenses)

  return recurring.reduce((sum, expense) => {
    if (expense.frequency === 'monthly') {
      return sum + expense.amount
    }

    if (expense.frequency === 'yearly') {
      const start = new Date(cycleWindow.start)
      const due = new Date(start.getFullYear(), start.getMonth(), expense.recurring_day)
      if (due.getTime() >= cycleWindow.start && due.getTime() < cycleWindow.end) {
        return sum + expense.amount
      }
    }

    return sum
  }, 0)
}

export function getUpcomingBills(
  expenses: ExpenseTransaction[],
  now: number,
  lookAheadDays: number,
): UpcomingBill[] {
  const recurring = getRecurringExpenses(expenses)
  const nowDate = new Date(now)
  const bills: UpcomingBill[] = []

  for (const expense of recurring) {
    let due = new Date(nowDate.getFullYear(), nowDate.getMonth(), expense.recurring_day)

    if (expense.frequency === 'weekly') {
      const currentDay = nowDate.getDay()
      const diff = expense.recurring_day - currentDay + (expense.recurring_day <= currentDay ? 7 : 0)
      due = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + diff)
    }

    if (due.getTime() < now) {
      if (expense.frequency === 'monthly') {
        due = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, expense.recurring_day)
      } else if (expense.frequency === 'yearly') {
        due = new Date(nowDate.getFullYear() + 1, nowDate.getMonth(), expense.recurring_day)
      }
    }

    const daysUntilDue = Math.round((due.getTime() - startOfDay(now)) / 86_400_000)

    if (daysUntilDue >= 0 && daysUntilDue <= lookAheadDays) {
      bills.push({
        transaction_id: expense.transaction_id,
        name: expense.name,
        amount: expense.amount,
        dueTimestamp: due.getTime(),
        daysUntilDue,
      })
    }
  }

  return bills.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/recurringExpenses.test.ts`

Expected: PASS

- [ ] **Step 7: Update `appDataService.ts` to persist recurring flags**

Modify `createExpense` and `updateExpense` to include recurring fields from draft. First update `ExpenseDraft` in `src/types/app-data.ts`:

```ts
export interface ExpenseDraft {
  // ... existing fields
  recurring?: boolean
  recurring_frequency?: 'weekly' | 'monthly' | 'yearly'
  recurring_day?: number
}
```

Then in `appDataService.ts`:

```ts
export async function createExpense(draft: ExpenseDraft): Promise<void> {
  // ...
  const transaction: ExpenseTransaction = {
    // ...
    recurring: draft.recurring,
    recurring_frequency: draft.recurring_frequency,
    recurring_day: draft.recurring_day,
  }
  await db.expenses.add(transaction)
}
```

Do the same for `updateExpense`.

- [ ] **Step 8: Update `useAppData.ts`**

Add computed:

```ts
import { getCycleFixedExpensesTotal, getUpcomingBills } from '@/lib/dailyFinance/recurringExpenses'

const cycleFixedExpensesTotal = computed(() =>
  currentWindow.value ? getCycleFixedExpensesTotal(data.value.expenses, currentWindow.value) : 0,
)

const upcomingBills = computed(() => getUpcomingBills(data.value.expenses, Date.now(), 14))
```

Update `dailySafeToSpend` to use `cycleFixedExpensesTotal`:

```ts
fixedExpensesTotal: cycleFixedExpensesTotal.value,
```

Expose:

```ts
cycleFixedExpensesTotal,
upcomingBills,
```

- [ ] **Step 9: Update `TransactionForm.vue`**

Add recurring checkbox and frequency/day inputs when kind is expense. Keep it minimal.

- [ ] **Step 10: Create `RecurringExpensesSummary.vue`**

A small component showing fixed total and upcoming bills list. Wire into `DashboardView.vue`.

- [ ] **Step 11: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add src/types/app-data.ts src/lib/backup.ts src/services/appDataService.ts \
  src/lib/dailyFinance/recurringExpenses.ts src/lib/dailyFinance/recurringExpenses.test.ts \
  src/composables/useAppData.ts src/components/transactions/TransactionForm.vue \
  src/components/dailyFinance/RecurringExpensesSummary.vue src/views/DashboardView.vue
git commit -m "feat: add recurring expenses and bill reminders"
```

---

### Task 3: Category Budget Alerts

**Files:**
- Create: `src/lib/dailyFinance/categoryAlerts.ts`
- Create: `src/lib/dailyFinance/categoryAlerts.test.ts`
- Modify: `src/composables/useAppData.ts`
- Create: `src/components/dailyFinance/CategoryAlertsList.vue`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `cycleExpenses`, `targetExpenses`, `activeExpenseCategories`, `currentCycle`.
- Produces: `getCategoryAlerts(expenses, targetLimits, categories, cycleWindow): CategoryAlert[]` exposed as `categoryAlerts`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/dailyFinance/categoryAlerts.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { ExpenseCategory, ExpenseTransaction, TargetExpenseLimit } from '@/types/app-data'
import { getCategoryAlerts } from './categoryAlerts'

function expense(category_id: string, amount: number, date: string): ExpenseTransaction {
  return {
    transaction_id: 'expense-1',
    category_id,
    name: 'Test',
    amount,
    date: new Date(date).getTime(),
    create_date: Date.now(),
    edit_date: Date.now(),
    synced: false,
  }
}

function category(id: string): ExpenseCategory {
  return {
    category_id: id,
    name_en: id,
    name_tc: id,
    color_code: '000000',
    icon_image_name: 'circle',
    custom: false,
    deleted: false,
  }
}

describe('getCategoryAlerts', () => {
  const window = { start: new Date('2026-07-01').getTime(), end: new Date('2026-08-01').getTime(), label: '' }
  const categories = [category('food'), category('transport')]
  const targets: TargetExpenseLimit[] = [
    { target_expense_id: 't1', cycle_id: 'cycle-1', category_id: 'food', amount: 1000 },
  ]

  test('marks category as ok when under 80%', () => {
    const expenses = [expense('food', 700, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window)

    expect(result[0]?.severity).toBe('ok')
    expect(result[0]?.percentage).toBe(70)
  })

  test('marks category as warning at 80%', () => {
    const expenses = [expense('food', 800, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window)

    expect(result[0]?.severity).toBe('warning')
  })

  test('marks category as danger over 100%', () => {
    const expenses = [expense('food', 1200, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window)

    expect(result[0]?.severity).toBe('danger')
    expect(result[0]?.remaining).toBe(-200)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/categoryAlerts.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/dailyFinance/categoryAlerts.ts`:

```ts
import type { CycleWindow } from '@/lib/budgetCycle'
import { isInCycleWindow } from '@/lib/budgetCycle'
import type { ExpenseCategory, ExpenseTransaction, TargetExpenseLimit } from '@/types/app-data'

export interface CategoryAlert {
  category_id: string
  category_name: string
  color_code: string
  target: number
  spent: number
  remaining: number
  percentage: number
  severity: 'ok' | 'warning' | 'danger'
}

export function getCategoryAlerts(
  expenses: ExpenseTransaction[],
  targetLimits: TargetExpenseLimit[],
  categories: ExpenseCategory[],
  cycleWindow: CycleWindow,
): CategoryAlert[] {
  const cycleExpenses = expenses.filter((expense) => isInCycleWindow(expense.date, cycleWindow))

  return targetLimits
    .map((target) => {
      const category = categories.find((c) => c.category_id === target.category_id)
      const spent = cycleExpenses
        .filter((expense) => expense.category_id === target.category_id)
        .reduce((sum, expense) => sum + expense.amount, 0)
      const percentage = target.amount > 0 ? (spent / target.amount) * 100 : 0
      let severity: CategoryAlert['severity'] = 'ok'

      if (percentage >= 100) {
        severity = 'danger'
      } else if (percentage >= 80) {
        severity = 'warning'
      }

      return {
        category_id: target.category_id,
        category_name: category?.name_tc ?? category?.name_en ?? target.category_id,
        color_code: category?.color_code ?? '000000',
        target: target.amount,
        spent,
        remaining: target.amount - spent,
        percentage,
        severity,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/categoryAlerts.test.ts`

Expected: PASS.

- [ ] **Step 5: Update `useAppData.ts`**

Add:

```ts
import { getCategoryAlerts } from '@/lib/dailyFinance/categoryAlerts'

const categoryAlerts = computed(() =>
  currentWindow.value
    ? getCategoryAlerts(
        data.value.expenses,
        data.value.targetExpenses,
        activeExpenseCategories.value,
        currentWindow.value,
      )
    : [],
)
```

Expose `categoryAlerts`.

- [ ] **Step 6: Create `CategoryAlertsList.vue`**

Progress bar list component. Wire into `DashboardView.vue`.

- [ ] **Step 7: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dailyFinance/categoryAlerts.ts src/lib/dailyFinance/categoryAlerts.test.ts \
  src/composables/useAppData.ts src/components/dailyFinance/CategoryAlertsList.vue \
  src/views/DashboardView.vue
git commit -m "feat: add category budget alerts"
```

---

### Task 4: Micro-saving Challenges

**Files:**
- Modify: `src/types/app-data.ts`
- Modify: `src/db/database.ts`
- Modify: `src/lib/backup.ts`
- Modify: `src/services/appDataService.ts`
- Modify: `src/composables/useAppData.ts`
- Create: `src/lib/dailyFinance/savingChallenges.ts`
- Create: `src/lib/dailyFinance/savingChallenges.test.ts`
- Create: `src/components/dailyFinance/SavingChallengesList.vue`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `savingChallenges`, `savings`.
- Produces: `SavingChallenge` type, `createChallenge`, `addSavingToChallenge`, `getActiveChallenges`.

- [ ] **Step 1: Add `SavingChallenge` type and update schemas**

Modify `src/types/app-data.ts`:

```ts
export interface AppDataPayload {
  // ... existing fields
  savingChallenges?: SavingChallenge[]
}

export interface SavingChallenge {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  status: 'active' | 'completed' | 'paused'
  created_at: number
  updated_at: number
}

export interface SavingRecord {
  // ... existing fields
  challenge_id?: string
}
```

- [ ] **Step 2: Update Dexie schema**

Modify `src/db/database.ts`:

```ts
import type { SavingChallenge } from '@/types/app-data'

export class ExpenseTrackerDatabase extends Dexie {
  // ... existing tables
  savingChallenges!: Table<SavingChallenge, string>

  constructor() {
    super('personal-expense-tracker')
    this.version(4).stores({
      // ... existing indexes
      savingChallenges: 'challenge_id, status, updated_at',
    })
  }
}
```

Update `createInitialPayload()`:

```ts
return {
  // ...
  savingChallenges: [],
}
```

- [ ] **Step 3: Update backup validation**

Modify `src/lib/backup.ts`:

```ts
const arrayKeys: Array<keyof AppDataPayload> = [
  // ... existing keys
]
// savingChallenges is optional, validate if present
if (payload.savingChallenges !== undefined) {
  if (!Array.isArray(payload.savingChallenges)) {
    errors.push('savingChallenges must be an array')
  } else {
    payload.savingChallenges.forEach((challenge, index) => {
      requireString(challenge, 'challenge_id', `savingChallenges[${index}]`, errors)
      requireString(challenge, 'name', `savingChallenges[${index}]`, errors)
      requireNumber(challenge, 'target_amount', `savingChallenges[${index}]`, errors)
      requireNumber(challenge, 'current_amount', `savingChallenges[${index}]`, errors)
      requireString(challenge, 'status', `savingChallenges[${index}]`, errors)
      requireNumber(challenge, 'created_at', `savingChallenges[${index}]`, errors)
      requireNumber(challenge, 'updated_at', `savingChallenges[${index}]`, errors)
    })
  }
}
```

- [ ] **Step 4: Add service functions**

Modify `src/services/appDataService.ts`:

```ts
export async function createSavingChallenge(name: string, target_amount: number): Promise<void> {
  const now = Date.now()
  const challenge: SavingChallenge = {
    challenge_id: makeId('challenge'),
    name: name.trim(),
    target_amount,
    current_amount: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
  }
  await db.savingChallenges.add(challenge)
}

export async function updateSavingChallenge(
  challengeId: string,
  updates: Partial<Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>>,
): Promise<void> {
  await db.savingChallenges.update(challengeId, { ...updates, updated_at: Date.now() })
}

export async function deleteSavingChallenge(challengeId: string): Promise<void> {
  await db.savingChallenges.delete(challengeId)
}
```

Update `createSaving` to accept optional `challenge_id` and increment challenge current_amount. Add a helper to update challenge total when saving is created.

- [ ] **Step 5: Write the failing test**

Create `src/lib/dailyFinance/savingChallenges.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { SavingChallenge, SavingRecord } from '@/types/app-data'
import { addSavingToChallenge, createChallenge, getActiveChallenges } from './savingChallenges'

describe('savingChallenges', () => {
  test('createChallenge returns active challenge with zero progress', () => {
    const challenge = createChallenge('旅行基金', 5000)

    expect(challenge.name).toBe('旅行基金')
    expect(challenge.target_amount).toBe(5000)
    expect(challenge.current_amount).toBe(0)
    expect(challenge.status).toBe('active')
  })

  test('getActiveChallenges aggregates linked savings', () => {
    const challenge: SavingChallenge = createChallenge('旅行基金', 5000)
    const savings: SavingRecord[] = [
      { saving_id: 's1', challenge_id: challenge.challenge_id, amount: 500, date: Date.now(), description: 'Deposit' },
      { saving_id: 's2', challenge_id: challenge.challenge_id, amount: 300, date: Date.now(), description: 'Deposit' },
    ]

    const result = getActiveChallenges([challenge], savings)

    expect(result[0]?.current_amount).toBe(800)
    expect(result[0]?.percentage).toBe(16)
  })

  test('addSavingToChallenge marks completed at target', () => {
    let challenge = createChallenge('小目標', 1000)
    challenge = addSavingToChallenge(challenge, 1000)

    expect(challenge.current_amount).toBe(1000)
    expect(challenge.status).toBe('completed')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/savingChallenges.test.ts`

Expected: FAIL.

- [ ] **Step 7: Write minimal implementation**

Create `src/lib/dailyFinance/savingChallenges.ts`:

```ts
import type { SavingChallenge, SavingRecord } from '@/types/app-data'

export interface ChallengeProgress {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  percentage: number
  status: 'active' | 'completed' | 'paused'
}

export function createChallenge(name: string, target_amount: number): SavingChallenge {
  const now = Date.now()
  return {
    challenge_id: `challenge-${crypto.randomUUID()}`,
    name,
    target_amount,
    current_amount: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
  }
}

export function addSavingToChallenge(challenge: SavingChallenge, amount: number): SavingChallenge {
  const current_amount = challenge.current_amount + amount
  return {
    ...challenge,
    current_amount,
    status: current_amount >= challenge.target_amount ? 'completed' : challenge.status,
    updated_at: Date.now(),
  }
}

export function getActiveChallenges(
  challenges: SavingChallenge[],
  savings: SavingRecord[],
): ChallengeProgress[] {
  return challenges
    .filter((challenge) => challenge.status === 'active' || challenge.status === 'completed')
    .map((challenge) => {
      const current_amount = savings
        .filter((saving) => saving.challenge_id === challenge.challenge_id)
        .reduce((sum, saving) => sum + saving.amount, 0)

      return {
        challenge_id: challenge.challenge_id,
        name: challenge.name,
        target_amount: challenge.target_amount,
        current_amount,
        percentage: challenge.target_amount > 0 ? Math.min((current_amount / challenge.target_amount) * 100, 100) : 0,
        status: current_amount >= challenge.target_amount ? 'completed' : challenge.status,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/savingChallenges.test.ts`

Expected: PASS.

- [ ] **Step 9: Update `useAppData.ts`**

Load `savingChallenges` in `loadAppData` via `appDataService`. Add to payload and expose:

```ts
const savingChallenges = computed(() => data.value.savingChallenges ?? [])
const activeChallengeProgress = computed(() => getActiveChallenges(savingChallenges.value, data.value.savings))
```

Add action wrappers for creating/updating/deleting challenges.

- [ ] **Step 10: Create `SavingChallengesList.vue`**

Dashboard card listing active challenges.

- [ ] **Step 11: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add src/types/app-data.ts src/db/database.ts src/lib/backup.ts src/services/appDataService.ts \
  src/lib/dailyFinance/savingChallenges.ts src/lib/dailyFinance/savingChallenges.test.ts \
  src/composables/useAppData.ts src/components/dailyFinance/SavingChallengesList.vue \
  src/views/DashboardView.vue
git commit -m "feat: add micro-saving challenges"
```

---

### Task 5: Weekly Review

**Files:**
- Create: `src/lib/dailyFinance/weeklyReview.ts`
- Create: `src/lib/dailyFinance/weeklyReview.test.ts`
- Create: `src/components/dailyFinance/WeeklyReviewModal.vue`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `combinedTransactions`, `activeExpenseCategories`, `now`.
- Produces: `getWeeklyReview(transactions, categories, now): WeeklyReview`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/dailyFinance/weeklyReview.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'
import { getWeeklyReview } from './weeklyReview'

function tx(kind: CombinedTransaction['kind'], amount: number, date: string, category_id = 'food'): CombinedTransaction {
  return {
    id: 't1',
    kind,
    category_id,
    name: 'Test',
    amount,
    date: new Date(date).getTime(),
  }
}

const categories: ExpenseCategory[] = [
  { category_id: 'food', name_en: 'Food', name_tc: '餐飲', color_code: 'b5392a', icon_image_name: 'utensils', custom: false, deleted: false },
]

describe('getWeeklyReview', () => {
  test('summarises last week', () => {
    const now = new Date('2026-07-06').getTime() // Monday
    const transactions: CombinedTransaction[] = [
      tx('expense', 100, '2026-06-29'), // last Monday
      tx('expense', 200, '2026-07-03'), // last Friday
      tx('income', 5000, '2026-07-01'),
      tx('saving', 500, '2026-07-02'),
    ]

    const result = getWeeklyReview(transactions, categories, now)

    expect(result.totalSpent).toBe(300)
    expect(result.totalIncome).toBe(5000)
    expect(result.totalSavings).toBe(500)
    expect(result.transactionCount).toBe(4)
    expect(result.topCategory?.name).toBe('餐飲')
    expect(result.vsPreviousWeek).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/weeklyReview.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/dailyFinance/weeklyReview.ts`:

```ts
import { startOfLocalDay } from '@/lib/date'
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

export interface WeeklyReview {
  weekStart: number
  weekEnd: number
  totalSpent: number
  totalIncome: number
  totalSavings: number
  transactionCount: number
  topCategory: { category_id: string; name: string; amount: number } | null
  vsPreviousWeek: {
    spentDelta: number
    spentDeltaPercent: number
  } | null
}

export function getWeeklyReview(
  transactions: CombinedTransaction[],
  categories: ExpenseCategory[],
  now: number,
): WeeklyReview {
  const nowDay = startOfLocalDay(new Date(now))
  const currentWeekStart = getMonday(nowDay)
  const lastWeekStart = currentWeekStart - 7 * 86_400_000
  const lastWeekEnd = currentWeekStart - 1
  const previousWeekStart = lastWeekStart - 7 * 86_400_000
  const previousWeekEnd = lastWeekStart - 1

  const lastWeekTransactions = transactions.filter((t) => t.date >= lastWeekStart && t.date <= lastWeekEnd)
  const previousWeekTransactions = transactions.filter(
    (t) => t.date >= previousWeekStart && t.date <= previousWeekEnd,
  )

  const totalSpent = sumByKind(lastWeekTransactions, 'expense')
  const totalIncome = sumByKind(lastWeekTransactions, 'income')
  const totalSavings = sumByKind(lastWeekTransactions, 'saving')

  const categorySpending = new Map<string, number>()
  lastWeekTransactions
    .filter((t) => t.kind === 'expense')
    .forEach((t) => {
      categorySpending.set(t.category_id, (categorySpending.get(t.category_id) ?? 0) + t.amount)
    })

  let topCategory: WeeklyReview['topCategory'] = null
  for (const [category_id, amount] of categorySpending) {
    if (!topCategory || amount > topCategory.amount) {
      const category = categories.find((c) => c.category_id === category_id)
      topCategory = { category_id, name: category?.name_tc ?? category?.name_en ?? category_id, amount }
    }
  }

  const previousSpent = sumByKind(previousWeekTransactions, 'expense')
  const vsPreviousWeek: WeeklyReview['vsPreviousWeek'] =
    previousWeekTransactions.length > 0
      ? {
          spentDelta: totalSpent - previousSpent,
          spentDeltaPercent: previousSpent !== 0 ? ((totalSpent - previousSpent) / previousSpent) * 100 : 0,
        }
      : null

  return {
    weekStart: lastWeekStart,
    weekEnd: lastWeekEnd,
    totalSpent,
    totalIncome,
    totalSavings,
    transactionCount: lastWeekTransactions.length,
    topCategory,
    vsPreviousWeek,
  }
}

function getMonday(timestamp: number): number {
  const date = new Date(timestamp)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff).getTime()
}

function sumByKind(transactions: CombinedTransaction[], kind: CombinedTransaction['kind']): number {
  return transactions.filter((t) => t.kind === kind).reduce((sum, t) => sum + t.amount, 0)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/weeklyReview.test.ts`

Expected: PASS.

- [ ] **Step 5: Update `useAppData.ts`**

Add:

```ts
import { getWeeklyReview } from '@/lib/dailyFinance/weeklyReview'

const weeklyReview = computed(() => getWeeklyReview(combinedTransactions.value, activeExpenseCategories.value, Date.now()))
```

Expose `weeklyReview`.

- [ ] **Step 6: Create `WeeklyReviewModal.vue`**

Modal displaying review summary. Add a button in `DashboardView.vue` to open it.

- [ ] **Step 7: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dailyFinance/weeklyReview.ts src/lib/dailyFinance/weeklyReview.test.ts \
  src/composables/useAppData.ts src/components/dailyFinance/WeeklyReviewModal.vue \
  src/views/DashboardView.vue
git commit -m "feat: add weekly review"
```

---

### Task 6: Quick Add Shortcuts

**Files:**
- Create: `src/lib/dailyFinance/quickAdd.ts`
- Create: `src/lib/dailyFinance/quickAdd.test.ts`
- Create: `src/components/dailyFinance/QuickAddShortcuts.vue`
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `combinedTransactions`, `activeExpenseCategories`.
- Produces: `parseQuickAddText(text, categories)`, `getFrequentTransactions(transactions, limit)`, `calculateSpareChange(amount)`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/dailyFinance/quickAdd.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'
import { calculateSpareChange, getFrequentTransactions, parseQuickAddText } from './quickAdd'

const categories: ExpenseCategory[] = [
  { category_id: 'food', name_en: 'Food', name_tc: '餐飲', color_code: 'b5392a', icon_image_name: 'utensils', custom: false, deleted: false },
]

describe('parseQuickAddText', () => {
  test('parses name and amount', () => {
    const result = parseQuickAddText('麥當勞 55', categories)

    expect(result).toEqual({ name: '麥當勞', amount: 55, category_id: undefined })
  })

  test('matches category by name', () => {
    const result = parseQuickAddText('餐飲 120', categories)

    expect(result?.category_id).toBe('food')
  })

  test('returns null for invalid text', () => {
    const result = parseQuickAddText('no amount here', categories)

    expect(result).toBeNull()
  })
})

describe('calculateSpareChange', () => {
  test('rounds up to nearest 10', () => {
    expect(calculateSpareChange(55)).toBe(5)
    expect(calculateSpareChange(60)).toBe(0)
  })
})

describe('getFrequentTransactions', () => {
  test('returns most frequent expenses', () => {
    const transactions: CombinedTransaction[] = [
      { id: '1', kind: 'expense', category_id: 'food', name: '咖啡', amount: 40, date: Date.now() },
      { id: '2', kind: 'expense', category_id: 'food', name: '咖啡', amount: 40, date: Date.now() },
      { id: '3', kind: 'expense', category_id: 'food', name: '巴士', amount: 12, date: Date.now() },
    ]

    const result = getFrequentTransactions(transactions, 1)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('咖啡')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/quickAdd.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/dailyFinance/quickAdd.ts`:

```ts
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

export interface QuickAddSuggestion {
  kind: 'expense' | 'income' | 'saving'
  category_id: string
  name: string
  amount?: number
}

export interface ParsedQuickAdd {
  name: string
  amount: number
  category_id?: string
}

export function parseQuickAddText(text: string, categories: ExpenseCategory[]): ParsedQuickAdd | null {
  const trimmed = text.trim()
  const match = trimmed.match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/)

  if (!match) {
    return null
  }

  const name = match[1]?.trim() ?? ''
  const amount = Number(match[2])
  const category = categories.find(
    (c) => c.name_en.toLowerCase() === name.toLowerCase() || c.name_tc === name,
  )

  return { name, amount, category_id: category?.category_id }
}

export function calculateSpareChange(amount: number): number {
  return Math.ceil(amount / 10) * 10 - amount
}

export function getFrequentTransactions(
  transactions: CombinedTransaction[],
  limit: number,
): QuickAddSuggestion[] {
  const ninetyDaysAgo = Date.now() - 90 * 86_400_000
  const recent = transactions.filter((t) => t.date >= ninetyDaysAgo && t.kind === 'expense')
  const counts = new Map<string, { name: string; category_id: string; count: number }>()

  for (const t of recent) {
    const key = `${t.name}|${t.category_id}`
    const existing = counts.get(key)

    if (existing) {
      existing.count++
    } else {
      counts.set(key, { name: t.name, category_id: t.category_id, count: 1 })
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({ kind: 'expense', category_id: item.category_id, name: item.name }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/quickAdd.test.ts`

Expected: PASS.

- [ ] **Step 5: Update `useAppData.ts`**

Add:

```ts
import { getFrequentTransactions } from '@/lib/dailyFinance/quickAdd'

const frequentTransactions = computed(() => getFrequentTransactions(combinedTransactions.value, 5))
```

Expose `frequentTransactions`.

- [ ] **Step 6: Create `QuickAddShortcuts.vue`**

Display shortcut chips and a text parser input. Wire into `DashboardView.vue`.

- [ ] **Step 7: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dailyFinance/quickAdd.ts src/lib/dailyFinance/quickAdd.test.ts \
  src/composables/useAppData.ts src/components/dailyFinance/QuickAddShortcuts.vue \
  src/views/DashboardView.vue
git commit -m "feat: add quick add shortcuts"
```

---

### Task 7: Monthly Snapshot

**Files:**
- Create: `src/lib/dailyFinance/monthlySnapshot.ts`
- Create: `src/lib/dailyFinance/monthlySnapshot.test.ts`
- Create: `src/views/MonthlySnapshotView.vue`
- Modify: `src/router/index.ts`
- Modify: `src/components/AppShell.vue`
- Modify: `src/composables/useAppData.ts`

**Interfaces:**
- Consumes: `cycles`, `expenses`, `incomes`, `savings`, `activeExpenseCategories`.
- Produces: `getMonthlySnapshot(cycles, expenses, incomes, savings, categories, now): MonthlySnapshot`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/dailyFinance/monthlySnapshot.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { BudgetCycle, ExpenseCategory, ExpenseTransaction, IncomeTransaction, SavingRecord } from '@/types/app-data'
import { getMonthlySnapshot } from './monthlySnapshot'

function cycle(code: string): BudgetCycle {
  return { cycle_id: `cycle-${code}`, cycle_code: code, income_day: 25, income: 30000, saving_target: 5000 }
}

describe('getMonthlySnapshot', () => {
  test('calculates current month snapshot', () => {
    const now = new Date('2026-07-04').getTime()
    const cycles = [cycle('202607'), cycle('202606')]
    const expenses: ExpenseTransaction[] = [
      { transaction_id: 'e1', category_id: 'food', name: 'Lunch', amount: 100, date: new Date('2026-07-02').getTime(), create_date: Date.now(), edit_date: Date.now(), synced: false },
    ]
    const incomes: IncomeTransaction[] = []
    const savings: SavingRecord[] = []
    const categories: ExpenseCategory[] = [
      { category_id: 'food', name_en: 'Food', name_tc: '餐飲', color_code: 'b5392a', icon_image_name: 'utensils', custom: false, deleted: false },
    ]

    const result = getMonthlySnapshot(cycles, expenses, incomes, savings, categories, now)

    expect(result.expenseTotal).toBe(100)
    expect(result.incomeTotal).toBe(30000)
    expect(result.savingsRate).toBe(0)
    expect(result.topExpenseCategories[0]?.percentage).toBe(100)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/monthlySnapshot.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/dailyFinance/monthlySnapshot.ts`:

```ts
import { getCycleWindow } from '@/lib/budgetCycle'
import type { BudgetCycle, ExpenseCategory, ExpenseTransaction, IncomeTransaction, SavingRecord } from '@/types/app-data'

export interface MonthlySnapshot {
  cycleWindow: { start: number; end: number; label: string }
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  savingsRate: number
  topExpenseCategories: { category_id: string; name: string; amount: number; percentage: number }[]
  remainingBudget: number
  dailyAverageSpent: number
  vsLastCycle: {
    expenseDelta: number
    expenseDeltaPercent: number
    savingDelta: number
  } | null
}

export function getMonthlySnapshot(
  cycles: BudgetCycle[],
  expenses: ExpenseTransaction[],
  incomes: IncomeTransaction[],
  savings: SavingRecord[],
  categories: ExpenseCategory[],
  now: number,
): MonthlySnapshot {
  const currentCycle = cycles[0]

  if (!currentCycle) {
    return {
      cycleWindow: { start: 0, end: 0, label: '' },
      incomeTotal: 0,
      expenseTotal: 0,
      savingTotal: 0,
      savingsRate: 0,
      topExpenseCategories: [],
      remainingBudget: 0,
      dailyAverageSpent: 0,
      vsLastCycle: null,
    }
  }

  const cycleWindow = getCycleWindow(currentCycle.cycle_code, currentCycle.income_day)
  const cycleExpenses = expenses.filter((e) => e.date >= cycleWindow.start && e.date < cycleWindow.end)
  const cycleIncomes = incomes.filter((i) => i.date >= cycleWindow.start && i.date < cycleWindow.end)
  const cycleSavings = savings.filter((s) => s.date >= cycleWindow.start && s.date < cycleWindow.end)

  const expenseTotal = cycleExpenses.reduce((sum, e) => sum + e.amount, 0)
  const incomeTotal = currentCycle.income + cycleIncomes.reduce((sum, i) => sum + i.amount, 0)
  const savingTotal = cycleSavings.reduce((sum, s) => sum + s.amount, 0)
  const remainingBudget = incomeTotal - expenseTotal - savingTotal
  const daysSoFar = Math.max(1, Math.floor((now - cycleWindow.start) / 86_400_000) + 1)
  const dailyAverageSpent = expenseTotal / daysSoFar

  const categoryTotals = new Map<string, number>()
  for (const expense of cycleExpenses) {
    categoryTotals.set(expense.category_id, (categoryTotals.get(expense.category_id) ?? 0) + expense.amount)
  }

  const topExpenseCategories = Array.from(categoryTotals.entries())
    .map(([category_id, amount]) => {
      const category = categories.find((c) => c.category_id === category_id)
      return {
        category_id,
        name: category?.name_tc ?? category?.name_en ?? category_id,
        amount,
        percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const savingsRate = incomeTotal > 0 ? savingTotal / incomeTotal : 0

  const lastCycle = cycles[1]
  const vsLastCycle: MonthlySnapshot['vsLastCycle'] = lastCycle
    ? (() => {
        const lastWindow = getCycleWindow(lastCycle.cycle_code, lastCycle.income_day)
        const lastExpenses = expenses.filter((e) => e.date >= lastWindow.start && e.date < lastWindow.end)
        const lastSavings = savings.filter((s) => s.date >= lastWindow.start && s.date < lastWindow.end)
        const lastExpenseTotal = lastExpenses.reduce((sum, e) => sum + e.amount, 0)
        const lastSavingTotal = lastSavings.reduce((sum, s) => sum + s.amount, 0)

        return {
          expenseDelta: expenseTotal - lastExpenseTotal,
          expenseDeltaPercent: lastExpenseTotal !== 0 ? ((expenseTotal - lastExpenseTotal) / lastExpenseTotal) * 100 : 0,
          savingDelta: savingTotal - lastSavingTotal,
        }
      })()
    : null

  return {
    cycleWindow,
    incomeTotal,
    expenseTotal,
    savingTotal,
    savingsRate,
    topExpenseCategories,
    remainingBudget,
    dailyAverageSpent,
    vsLastCycle,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/monthlySnapshot.test.ts`

Expected: PASS.

- [ ] **Step 5: Update `useAppData.ts`**

Add:

```ts
import { getMonthlySnapshot } from '@/lib/dailyFinance/monthlySnapshot'

const monthlySnapshot = computed(() =>
  getMonthlySnapshot(
    data.value.cycles,
    data.value.expenses,
    data.value.incomes,
    data.value.savings,
    activeExpenseCategories.value,
    Date.now(),
  ),
)
```

Expose `monthlySnapshot`.

- [ ] **Step 6: Create `MonthlySnapshotView.vue`**

New view with KPIs and top categories.

- [ ] **Step 7: Add route and menu**

Modify `src/router/index.ts`:

```ts
import MonthlySnapshotView from '@/views/MonthlySnapshotView.vue'

{ path: '/monthly-snapshot', name: 'monthly-snapshot', component: MonthlySnapshotView }
```

Modify `src/components/AppShell.vue` to add navigation link.

- [ ] **Step 8: Run full verification**

Run: `bun test:unit`, `bun run build`, `bun lint`

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/dailyFinance/monthlySnapshot.ts src/lib/dailyFinance/monthlySnapshot.test.ts \
  src/composables/useAppData.ts src/views/MonthlySnapshotView.vue \
  src/router/index.ts src/components/AppShell.vue
git commit -m "feat: add monthly snapshot view"
```

---

## Final Integration

- [ ] **Step 1: Run entire test suite**

Run: `bun test:unit`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `bun run build`

Expected: PASS.

- [ ] **Step 3: Run linter**

Run: `bun lint`

Expected: PASS.

- [ ] **Step 4: Final commit if any fixes**

```bash
git commit -m "chore: fix integration issues" || echo "no changes"
```

## Self-Review Checklist

- [ ] Spec coverage: every design section maps to a task.
- [ ] Placeholder scan: no TBD/TODO/"implement later".
- [ ] Type consistency: `SafeToSpendInput`, `RecurringExpense`, `UpcomingBill`, `CategoryAlert`, `ChallengeProgress`, `WeeklyReview`, `ParsedQuickAdd`, `MonthlySnapshot` match between tasks.
- [ ] Backward compatibility: all new fields optional, `savingChallenges` optional in payload.
- [ ] Each task ends with an independently testable deliverable.
