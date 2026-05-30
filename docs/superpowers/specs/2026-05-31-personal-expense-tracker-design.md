# Personal Expense Tracker Design

## Goal

Build a route-based personal expense tracker app in the existing Vue 3 + Vite project. The app stores all data locally in IndexedDB through Dexie.js, follows the supplied `AppDataPayload` schema, supports full backup and replace-all restore, and uses Tailwind CSS for the interface.

The first version should feel dashboard-first while still having dedicated routes for deeper workflows. Users should be able to understand the current budget cycle quickly, add transactions, manage budgets and categories, and protect their data through JSON export/import.

## Product Direction

The selected product shape is a dashboard-first experience inside a route-based application. The dashboard answers "How am I doing this cycle?" with current-cycle totals, savings progress, remaining budget, category target bars, recent activity, and a quick-add entry point.

Dedicated routes keep the app maintainable as the tracker grows:

- `/` Dashboard: current pay-cycle overview, remaining budget, savings progress, category target bars, recent transactions, and quick add.
- `/transactions`: searchable and editable expense and income ledger.
- `/budgets`: budget cycles, income day, income amount, saving target, and per-category target limits.
- `/categories`: expense and income category management with color, icon name, custom, and soft-delete fields.
- `/settings`: backup export, replace-all restore, app preferences, and data maintenance actions.

## Data Model

Dexie will manage one IndexedDB database with one table per top-level collection in `AppDataPayload`:

- `cycles`
- `expenseCategories`
- `incomeCategories`
- `expenses`
- `incomes`
- `targetExpenses`
- `savings`
- `settings`

The TypeScript interfaces from the prompt are the source of truth for application data. Persistence modules should expose typed data operations so Vue components do not call Dexie table methods directly.

The app will seed initial data on first launch:

- A current budget cycle using the current year/month as `cycle_code`.
- A small set of default expense categories.
- A small set of default income categories.
- Empty expenses, incomes, target expenses, and savings.
- Basic settings, including a preferred currency display parameter seeded to `HKD`.

## Budget Cycle Rules

Budget cycles group transactions by `income_day`, not calendar month.

For a cycle with `cycle_code = "202605"` and `income_day = 25`, the May 2026 cycle window is April 25, 2026 through May 24, 2026. Dashboard summaries, budget target comparisons, and transaction filtering must all use the same helper for this calculation.

When `income_day` is larger than the number of days in a month, the cycle boundary should clamp to that month's final day. This keeps cycle calculations valid for February and shorter months.

## Backup And Restore

Backup exports the full IndexedDB contents as a JSON file matching `AppDataPayload`.

Restore is replace-all for v1:

1. Read a user-selected JSON file.
2. Parse it as an `AppDataPayload`.
3. Validate that every required top-level array exists.
4. Validate the minimal required fields for each record type before writing.
5. Ask for confirmation that local data will be replaced.
6. Clear every Dexie table.
7. Bulk insert the imported records.
8. Refresh the app state.

Malformed JSON, missing arrays, or invalid records must fail before existing local data is touched.

## UI Direction

The app will use Tailwind CSS with a calm, operational finance interface. The design should be dense enough for daily scanning and restrained enough to avoid a marketing-page feel.

The shell will provide route navigation and persistent current-cycle context. Desktop will use a compact sidebar, while mobile will use a top app bar with condensed navigation. Mobile should prioritize quick add, current balance, and recent transactions before secondary controls.

Category colors will be used as accents in bars, chips, and labels. Cards are appropriate for dashboard widgets and repeated transaction/category rows, but page sections should remain clear and work-focused.

## Error Handling

Forms will use inline validation for required fields, numeric amounts, valid dates, and category/cycle references. Empty states should guide the user toward creating a cycle, category, or transaction when data is missing.

Restore failures should produce readable messages that distinguish parse errors, missing schema sections, invalid records, and write failures. Replace-all restore must never clear local data until validation succeeds and the user confirms the operation.

## Testing And Verification

Implementation verification must include:

- Type-checking with the project TypeScript/Vue tooling.
- A production build.
- Manual browser verification of the primary routes and backup/restore flow.

If practical within the project setup, add focused automated tests for:

- Pay-cycle window calculations from `cycle_code` and `income_day`.
- `AppDataPayload` validation for backup/restore.

These are the highest-risk parts because they affect financial totals and data safety.
