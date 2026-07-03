# Daily Finance Enhancement Design

## Context

This project is a Vue 3 + Dexie.js personal expense tracker. Existing features include budget cycles, expense/income/savings recording, category management, category budget targets (`targetExpenses`), trip budgeting, FX conversion, and data import/export/restore.

The user wants to add 7 daily-personal-finance features to help with day-to-day money decisions.

## Goal

Plan and implement 7 daily-finance features in separate TDD phases. All data changes must be backward compatible: existing user data, backups, and imports continue to work without manual migration.

## Non-goals

- Investment portfolio tracking
- Retirement planning
- Tax filing automation
- Push notifications / native reminders (bill reminders are in-app only)
- Bank account synchronization

## Architectural Approach

Use **feature-based decomposition**. Each feature becomes a focused pure-function module under `src/lib/dailyFinance/`. Business logic lives in these modules, tested with Vitest. `useAppData.ts` exposes the results as `computed` values. `DashboardView.vue` and new small components only handle layout and user interaction.

This keeps files small, makes TDD natural, and allows each feature to be implemented, tested, and committed independently.

## Data Model Changes

All changes are additive and optional. Existing records without the new fields continue to work.

### `ExpenseTransaction`

Add optional fields:

```ts
recurring?: boolean
recurring_frequency?: 'weekly' | 'monthly' | 'yearly'
recurring_day?: number // day of month (1-31) or day of week (0-6)
```

Default behavior: `recurring` is `false` if absent.

### `SavingRecord`

Add optional field:

```ts
challenge_id?: string
```

Default behavior: savings not linked to a challenge if absent.

### New domain type: `SavingChallenge`

Stored as a new Dexie table `savingChallenges`.

```ts
export interface SavingChallenge {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  status: 'active' | 'completed' | 'paused'
  created_at: number
  updated_at: number
}
```

### `AppDataPayload`

```ts
export interface AppDataPayload {
  // ... existing fields
  savingChallenges?: SavingChallenge[]
}
```

### Backward Compatibility

- All new fields are optional.
- `createInitialPayload()` returns empty `savingChallenges: []`.
- `validateAppDataPayload()` treats `savingChallenges` as optional (same pattern as `trips` and `fxRates`).
- Dexie schema version bumps from 3 to 4 and adds `savingChallenges` table.
- Old backups without `savingChallenges` import successfully.

## Feature Designs

### Feature 1: Daily Safe-to-Spend

**Purpose:** Tell the user how much they can safely spend today without risking running out before the next income day.

**Module:** `src/lib/dailyFinance/safeToSpend.ts`

**Core function:**

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
  projectedSurplus: number // negative means projected deficit
  isOverToday: boolean
}

export function getSafeToSpend(input: SafeToSpendInput): SafeToSpendResult
```

**Calculation:**

```
available = remainingBudget - fixedExpensesTotal - savingTarget
daily = available / max(daysUntilNextIncome, 1)
safeToSpendToday = daily - todaySpent
projectedSurplus = remainingBudget - fixedExpensesTotal - savingTarget
isOverToday = safeToSpendToday < 0
```

**UI:** Replace the current "每日可用" `MetricCard` on `DashboardView.vue` with a more accurate value and tone. Add a small detail showing "今日已用".

**Tests:** Zero budget, mid-cycle, overspent today, no fixed expenses, future income day edge cases.

---

### Feature 2: Recurring Expenses / Bill Reminders

**Purpose:** Surface fixed monthly/weekly/yearly expenses and upcoming bills so the user knows what is already committed.

**Module:** `src/lib/dailyFinance/recurringExpenses.ts`

**Core functions:**

```ts
export interface RecurringExpense {
  transaction_id: string
  name: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  recurring_day: number
}

export function getRecurringExpenses(
  expenses: ExpenseTransaction[],
): RecurringExpense[]

export interface UpcomingBill {
  transaction_id: string
  name: string
  amount: number
  dueTimestamp: number
  daysUntilDue: number
}

export function getUpcomingBills(
  expenses: ExpenseTransaction[],
  now: number,
  lookAheadDays: number,
): UpcomingBill[]

export function getCycleFixedExpensesTotal(
  expenses: ExpenseTransaction[],
  cycleWindow: CycleWindow,
): number
```

**Rules:**

- Only expenses with `recurring === true` are considered.
- `frequency` determines the next due date from `now`.
- `recurring_day` is interpreted relative to frequency.
- For the current cycle total, monthly recurring expenses count once; yearly ones count only if their anniversary falls inside the cycle window.

**UI:**

- New dashboard section "本月固定支出" showing total committed amount.
- New dashboard section "即將到期帳單" listing upcoming bills in the next 14 days.
- Add a checkbox + frequency selector in `TransactionForm.vue` when editing/creating expenses.

**Tests:** Monthly bill, yearly bill due this cycle, bill already paid this cycle (deduplicate by name+amount), no recurring expenses.

---

### Feature 3: Category Budget Alerts

**Purpose:** Warn the user when a category is close to or over its budget target for the current cycle.

**Module:** `src/lib/dailyFinance/categoryAlerts.ts`

**Core function:**

```ts
export interface CategoryAlert {
  category_id: string
  category_name: string
  color_code: string
  target: number
  spent: number
  remaining: number
  percentage: number // 0-100+
  severity: 'ok' | 'warning' | 'danger'
}

export function getCategoryAlerts(
  expenses: ExpenseTransaction[],
  targetLimits: TargetExpenseLimit[],
  categories: ExpenseCategory[],
  cycleWindow: CycleWindow,
): CategoryAlert[]
```

**Severity rules:**

- `danger`: spent >= 100% of target
- `warning`: spent >= 80% of target
- `ok`: below 80%

Categories without a target for the current cycle are omitted.

**UI:**

- New dashboard section "分類預算警報" with progress bars per category.
- Progress bar color follows `severity`.

**Tests:** Under budget, at 80%, over 100%, no target set, multiple categories.

---

### Feature 4: Micro-saving Challenges

**Purpose:** Help users build saving habits through small, gamified challenges.

**Module:** `src/lib/dailyFinance/savingChallenges.ts`

**Core functions:**

```ts
export interface ChallengeProgress {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  percentage: number
  status: 'active' | 'completed' | 'paused'
}

export function getActiveChallenges(
  challenges: SavingChallenge[],
  savings: SavingRecord[],
): ChallengeProgress[]

export function createChallenge(name: string, target_amount: number): SavingChallenge

export function addSavingToChallenge(
  challenge: SavingChallenge,
  amount: number,
): SavingChallenge
```

**Challenge types supported:**

1. **Custom target**: user-defined name and target amount.
2. **Spare change**: auto-created challenge that accumulates rounded-up differences (implemented in quick-add phase).

**UI:**

- New dashboard card "儲蓄挑戰" listing active challenges with progress bars.
- New view or modal to create/manage challenges.
- Quick-add savings can optionally be linked to a challenge.

**Tests:** Empty challenges, one active challenge, completed challenge, savings aggregation across multiple records.

---

### Feature 5: Weekly Review

**Purpose:** Give the user a concise Sunday-style review of last week's spending.

**Module:** `src/lib/dailyFinance/weeklyReview.ts`

**Core function:**

```ts
export interface WeeklyReview {
  weekStart: number
  weekEnd: number
  totalSpent: number
  totalIncome: number
  totalSavings: number
  transactionCount: number
  topCategory: { category_id: string; name: string; amount: number } | null
  vsPreviousWeek: {
    spentDelta: number // negative means spent less
    spentDeltaPercent: number
  }
}

export function getWeeklyReview(
  transactions: CombinedTransaction[],
  categories: ExpenseCategory[],
  now: number,
): WeeklyReview
```

**Rules:**

- "Last week" is the most recently completed Monday–Sunday period.
- "Previous week" is the week before that.
- Top category is based on expenses only.

**UI:**

- Dashboard button "上週回顧" opening a modal.
- Modal shows total spent, income, savings, transaction count, top category, and week-over-week change.

**Tests:** Empty week, normal week, week spanning two months, no previous week data.

---

### Feature 6: Quick Add Shortcuts

**Purpose:** Reduce friction when recording common transactions.

**Module:** `src/lib/dailyFinance/quickAdd.ts`

**Core functions:**

```ts
export interface QuickAddSuggestion {
  kind: 'expense' | 'income' | 'saving'
  category_id: string
  name: string
  amount?: number
}

export function getFrequentTransactions(
  transactions: CombinedTransaction[],
  limit: number,
): QuickAddSuggestion[]

export interface ParsedQuickAdd {
  name: string
  amount: number
  category_id?: string
}

export function parseQuickAddText(
  text: string,
  categories: ExpenseCategory[],
): ParsedQuickAdd | null
```

**Rules:**

- Frequent transactions are derived from the last 90 days, grouped by `name + category_id`, sorted by count.
- Text parser supports patterns like:
  - `麥當勞 55` → name "麥當勞", amount 55
  - `交通 12.5` → name "交通", amount 12.5, category matched by name
- Spare-change rule: optionally round amount up to nearest 10 and return the difference as a saving draft.

**UI:**

- Dashboard shows shortcut chips for top frequent transactions.
- Quick-add modal has a text input for fast parsing.
- One-tap saving for spare-change amount.

**Tests:** Parse Chinese text, parse with category match, frequent transactions grouping, spare change calculation.

---

### Feature 7: Monthly Snapshot

**Purpose:** A single-page summary of the current month's financial health.

**Module:** `src/lib/dailyFinance/monthlySnapshot.ts`

**Core function:**

```ts
export interface MonthlySnapshot {
  cycleWindow: CycleWindow
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  savingsRate: number // 0-1
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
): MonthlySnapshot
```

**UI:**

- Add a new route `/monthly-snapshot` and menu item in `AppShell.vue`.
- Show income/expense/savings KPIs, savings rate, top categories, and comparison to last cycle.

**Tests:** Current cycle only, multiple cycles, zero expenses, savings rate calculation.

## Persistence & Service Changes

1. **Dexie schema** version 4 adds `savingChallenges` table.
2. **`appDataService.ts`** adds:
   - `createSavingChallenge(draft)`
   - `updateSavingChallenge(id, draft)`
   - `deleteSavingChallenge(id)`
   - `saveRecurringFlags(expenseId, flags)`
3. **`useAppData.ts`** adds computed values for each feature and action wrappers.
4. **`validateAppDataPayload()`** in `src/lib/backup.ts` updated to allow optional `savingChallenges`.

## UI/Component Plan

- `DashboardView.vue`: integrates new metric cards and sections.
- `SafeToSpendCard.vue`: dedicated card for daily safe-to-spend.
- `RecurringExpensesSummary.vue`: fixed expenses + upcoming bills.
- `CategoryAlertsList.vue`: progress bars for category budgets.
- `SavingChallengesList.vue`: challenge progress cards.
- `WeeklyReviewModal.vue`: modal for last week review.
- `QuickAddShortcuts.vue`: chips + text parser input.
- `MonthlySnapshotView.vue`: new view for monthly summary.
- `TransactionForm.vue`: add recurring flag inputs.

## Testing Strategy

Each feature follows strict TDD:

1. Write `src/lib/dailyFinance/<feature>.test.ts` with failing tests.
2. Implement `src/lib/dailyFinance/<feature>.ts`.
3. Run `bun test:unit src/lib/dailyFinance/<feature>.test.ts` until green.
4. Wire into `useAppData.ts` and add integration tests where valuable.
5. Add UI component with minimal visual tests if needed.
6. Run `bun test:unit`, `bun run build`, `bun lint`.
7. Commit.

Tests use real data and pure functions; no mocks except for date injection.

## Phase Plan

| Phase | Feature | Deliverable |
|---|---|---|
| 1 | Daily Safe-to-Spend | `safeToSpend.ts` + tests, updated dashboard metric |
| 2 | Recurring Expenses / Bills | `recurringExpenses.ts` + tests, schema v4, form checkbox |
| 3 | Category Budget Alerts | `categoryAlerts.ts` + tests, dashboard section |
| 4 | Micro-saving Challenges | `savingChallenges.ts` + tests, new table, dashboard card |
| 5 | Weekly Review | `weeklyReview.ts` + tests, modal |
| 6 | Quick Add Shortcuts | `quickAdd.ts` + tests, shortcut chips |
| 7 | Monthly Snapshot | `monthlySnapshot.ts` + tests, new route/view |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Dashboard becomes too crowded | Each feature is a small component; layout reviewed after phase 3 |
| Dexie migration issues | All new fields optional; schema version bump only adds table |
| Date/time locale bugs | All date functions accept injected `now`; tests cover month boundaries |
| Recurring due-date logic errors | Start with monthly only; yearly/weekl y added after monthly is solid |

## Decisions Made

- Bill reminders are **in-app only** (no push notifications).
- Recurring expenses are flagged manually by the user; auto-detection is out of scope.
- Micro-saving challenges support custom targets and spare-change rounding.
- Quick-add text parser supports `<name> <amount>` with optional category matching.
- Monthly snapshot compares against the immediately previous cycle only.
