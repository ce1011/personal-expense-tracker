# Fixed Expenses Page Design

## Context

This project is a Vue 3 + Dexie.js personal expense tracker. The dashboard already shows a summary of fixed (recurring) expenses and upcoming bills via `RecurringExpensesSummary.vue`. Users currently create fixed expenses inside `TransactionForm.vue` by marking an expense as recurring.

## Goal

Create an independent **固定開支** page that makes managing recurring/fixed expenses easier by providing a dedicated list, CRUD operations, and summary statistics, without changing the underlying data model.

## Non-goals

- Change the persistence layer or introduce a new table/schema
- Modify how recurring expenses are stored
- Add push/reminder notifications for upcoming bills
- Multi-currency fixed-expense handling (amounts are shown in the app base currency `HKD`)

## Architectural Approach

Reuse the existing `ExpenseTransaction` recurring model (`recurring: true`, `recurring_frequency`, `recurring_day`). The page is a standard view with a summary section, a list of fixed expenses, and a modal form for creating/editing.

Business logic for summaries stays in `src/lib/dailyFinance/recurringExpenses.ts`. The view and components only handle layout, user interaction, and delegation to `useAppData` actions.

## Data Model

No changes. A fixed expense is an `ExpenseTransaction` with:

```ts
recurring: true
recurring_frequency: 'weekly' | 'monthly' | 'yearly'
recurring_day: number // 1–31 for monthly/yearly, 0–6 for weekly
```

The page filters `appData.data.value.expenses` by `recurring === true` and treats each record as one fixed expense entry.

## Page Structure

### Route

- Path: `/fixed-expenses`
- Name: `fixed-expenses`
- Sidebar placement: secondary group **資料維護**, between **分類** and **JSON 匯入**
- Icon: `Receipt` (Lucide)

### Summary Section (top of page)

Three `MetricCard` components:

1. **本期固定支出總額** — `appData.cycleFixedExpensesTotal` (computed in `useAppData`)
2. **即將到期帳單** — count of `appData.upcomingBills`
3. **平均每筆固定開支** — `totalAmount / count` of all recurring expenses

### List Section

A card/table-like list showing each fixed expense:

- Name
- Amount (HKD)
- Frequency label (`每週`, `每月`, `每年`)
- Due day label (`每週 X`, `每月 X 日`, `每年 X 日`)
- Category color dot + category name
- Edit and Delete actions

Empty state: title "目前沒有固定開支", message "新增固定開支後，它們會顯示在這裡並自動計入本期預算。"

### Modal Form

A dedicated `FixedExpenseForm.vue` modal using `BaseModal`. Fields:

- **名稱** (text, required)
- **金額** (number, required, min 0.01, step 0.01)
- **分類** (select, required, from active expense categories)
- **週期** (select: `weekly` | `monthly` | `yearly`, default `monthly`)
- **到期日/星期** (number input)
  - monthly/yearly: 1–31
  - weekly: 0–6 with labels 日–六
- Validation errors shown inline.

## Components

### New

- `src/views/FixedExpensesView.vue` — page container, summary, list, form orchestration
- `src/components/fixedExpenses/FixedExpensesList.vue` — list rendering and row actions
- `src/components/fixedExpenses/FixedExpenseForm.vue` — create/edit modal form

### Modified

- `src/router/index.ts` — add `/fixed-expenses` route
- `src/components/AppShell.vue` — add nav item to secondary group
- `src/components/dailyFinance/RecurringExpensesSummary.vue` — optionally add a link/button to open the new page ("管理固定開支")

## Data Flow

1. View calls `useAppData()`.
2. `fixedExpenses` computed filters `data.value.expenses` where `recurring === true`.
3. Creating/updating/deleting delegates to:
   - `appData.addExpense(draft)` — for new fixed expenses
   - `appData.updateExpense(id, draft)` — for edits
   - `appData.deleteExpense(id)` — for deletes
4. Form draft shape matches `ExpenseDraft` with `recurring: true` and the selected frequency/day.

## Frequency Display Helpers

Add pure helpers in `src/lib/dailyFinance/recurringExpenses.ts`:

```ts
export function getFrequencyLabel(frequency: 'weekly' | 'monthly' | 'yearly'): string
export function getRecurringDayLabel(
  frequency: 'weekly' | 'monthly' | 'yearly',
  day: number,
): string
```

## Error Handling

- Form validates required fields and numeric ranges before submission.
- `useAppData` surfaces persistence errors in `appData.error`; the view shows a banner.
- Delete requires `confirm('確定要刪除這個固定開支嗎？')`.
- Closing the modal without saving discards changes.

## Testing Strategy

1. Add unit tests for `getFrequencyLabel` and `getRecurringDayLabel` in `src/lib/dailyFinance/recurringExpenses.test.ts`.
2. Run `bun test:unit src/lib/dailyFinance/recurringExpenses.test.ts`.
3. Build and lint: `bun run build && bun lint`.
4. Manual smoke test: create, edit, delete a fixed expense; verify dashboard summary updates.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Users confuse this page with regular transactions | Clear page title, description, and sidebar label |
| Recurring day out of range | Form validation enforces valid ranges per frequency |
| Dashboard summary duplicated | Keep summary read-only; page is the management surface |

## Decisions Made

- No new Dexie table; reuse existing `ExpenseTransaction` recurring fields.
- Modal form is dedicated to fixed expenses; does not support trip or FX fields to keep scope focused.
- Average amount metric uses all recurring expenses, not just current cycle.
