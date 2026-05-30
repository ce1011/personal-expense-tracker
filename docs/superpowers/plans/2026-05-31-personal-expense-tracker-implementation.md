# Personal Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved route-based personal expense tracker with Dexie IndexedDB persistence, Tailwind CSS UI, pay-cycle budgeting, and replace-all backup/restore.

**Architecture:** Add a typed data layer around Dexie, pure utilities for pay-cycle math and backup validation, a shared app-data composable for route views, and focused Vue SFCs for the app shell and pages. Route views compose smaller feature components while all persistent writes flow through typed service functions.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia-compatible Vite scaffold, Dexie.js, Tailwind CSS, Vitest for focused utility tests, Bun/NPM scripts already present in the project.

---

## File Structure

- Modify `package.json`: add Dexie, Tailwind, Vitest scripts and dependencies.
- Modify `vite.config.ts`: enable Tailwind Vite plugin.
- Create `src/assets/main.css`: Tailwind import plus global tokens/base styles.
- Modify `src/main.ts`: import global CSS.
- Modify `src/router/index.ts`: define five app routes.
- Replace `src/App.vue`: app shell with route navigation and current-cycle context.
- Create `src/types/app-data.ts`: schema interfaces from the prompt and form helper types.
- Create `src/lib/date.ts`: timestamp/date input helpers.
- Create `src/lib/formatters.ts`: currency, date, percent, and color helpers.
- Create `src/lib/budgetCycle.ts`: pure income-day pay-cycle calculations.
- Create `src/lib/backup.ts`: payload validation, export shape, and parse helpers.
- Create `src/db/database.ts`: Dexie database, table definitions, seed data.
- Create `src/services/appDataService.ts`: typed CRUD and backup/restore operations.
- Create `src/composables/useAppData.ts`: load/refresh state, derived current-cycle summaries, write actions.
- Create `src/components/AppShell.vue`: responsive layout/navigation.
- Create `src/components/common/MetricCard.vue`: dashboard metric widget.
- Create `src/components/common/EmptyState.vue`: reusable empty state.
- Create `src/components/transactions/TransactionForm.vue`: expense/income quick add form.
- Create `src/components/transactions/TransactionList.vue`: combined transaction list.
- Create `src/components/budgets/TargetLimitEditor.vue`: per-category target limit controls.
- Create `src/views/DashboardView.vue`: summary, quick add, category budget bars, recent transactions.
- Create `src/views/TransactionsView.vue`: ledger, filters, and add form.
- Create `src/views/BudgetsView.vue`: cycle editor and target limits.
- Create `src/views/CategoriesView.vue`: category creation/edit/soft delete.
- Create `src/views/SettingsView.vue`: backup export and replace-all restore.
- Create `src/lib/budgetCycle.test.ts`: pay-cycle tests.
- Create `src/lib/backup.test.ts`: backup validation tests.

## Component Map

- `App.vue`: provides app-data context and renders `AppShell`.
- `AppShell.vue`: owns responsive navigation layout; props: `cycles`, `currentCycle`, `loading`; emits: none.
- Route views: orchestrate page-specific state and call composable actions.
- `TransactionForm.vue`: edits local form state; props: `expenseCategories`, `incomeCategories`, optional `compact`; emits: `create-expense`, `create-income`.
- `TransactionList.vue`: renders combined transactions; props: `items`, `expenseCategories`, `incomeCategories`, `currency`; emits: none.
- `TargetLimitEditor.vue`: edits limits for a cycle; props: `cycle`, `categories`, `limits`, `currency`; emits: `save-limit`.
- `MetricCard.vue`: presentational metric card; props: `label`, `value`, optional `detail`, `tone`.
- `EmptyState.vue`: presentational empty state; props: `title`, `message`.

## Tasks

### Task 1: Dependencies And Styling Foundation

- [ ] Install dependencies: `bun add dexie @tailwindcss/vite tailwindcss lucide-vue-next && bun add -d vitest jsdom`.
- [ ] Update `package.json` scripts with `test:unit`.
- [ ] Configure `vite.config.ts` to use the Tailwind Vite plugin.
- [ ] Create `src/assets/main.css` with `@import "tailwindcss";` and global base styles.
- [ ] Import `src/assets/main.css` from `src/main.ts`.
- [ ] Run `bun run type-check` and `bun run test:unit -- --run`; expected status after this task is type-check passing and either no tests found or the new test runner starting successfully.

### Task 2: Types And Pure Utilities With TDD

- [ ] Create failing tests in `src/lib/budgetCycle.test.ts` for income-day windows, including May 2026 with income day 25 and February clamping.
- [ ] Run `bun run test:unit -- --run src/lib/budgetCycle.test.ts`; expected failure because `getCycleWindow` does not exist.
- [ ] Create `src/types/app-data.ts`, `src/lib/date.ts`, `src/lib/formatters.ts`, and `src/lib/budgetCycle.ts`.
- [ ] Re-run the budget-cycle test; expected pass.
- [ ] Create failing tests in `src/lib/backup.test.ts` for valid payload acceptance and missing top-level array rejection.
- [ ] Run `bun run test:unit -- --run src/lib/backup.test.ts`; expected failure because backup validation does not exist.
- [ ] Create `src/lib/backup.ts`.
- [ ] Re-run `bun run test:unit -- --run src/lib/budgetCycle.test.ts src/lib/backup.test.ts`; expected pass.

### Task 3: Dexie Database And App Data Service

- [ ] Create `src/db/database.ts` with typed Dexie tables and seed defaults.
- [ ] Create `src/services/appDataService.ts` with load, seed, create, update, soft-delete, export, and replace-all restore operations.
- [ ] Run `bun run type-check`; expected pass.

### Task 4: Shared App Data Composable

- [ ] Create `src/composables/useAppData.ts` to load data, expose readonly state, compute current cycle summaries, and wrap service writes.
- [ ] Run `bun run type-check`; expected pass.

### Task 5: Router, Shell, And Common Components

- [ ] Update `src/router/index.ts` with `/`, `/transactions`, `/budgets`, `/categories`, `/settings`.
- [ ] Replace `src/App.vue` with the provider/composition root.
- [ ] Create `src/components/AppShell.vue`, `src/components/common/MetricCard.vue`, and `src/components/common/EmptyState.vue`.
- [ ] Run `bun run type-check`; expected pass.

### Task 6: Feature Components And Views

- [ ] Create transaction form/list components and the dashboard/transactions views.
- [ ] Create budget target editor and budgets view.
- [ ] Create categories view.
- [ ] Create settings view with export and replace-all restore UI.
- [ ] Run `bun run type-check`; expected pass.

### Task 7: Verification

- [ ] Run `bun run test:unit -- --run`; expected pass.
- [ ] Run `bun run build`; expected pass.
- [ ] Start `bun run dev -- --host 127.0.0.1`.
- [ ] Use the in-app browser to verify the five routes render, quick add creates a transaction, export downloads JSON, and invalid restore shows a validation error before clearing data.
- [ ] Commit implementation changes after verification.

## Self-Review

- Spec coverage: routes, Dexie schema, seeded data, income-day grouping, replace-all restore, Tailwind UI, error handling, and verification are each assigned to tasks.
- Placeholder scan: no task depends on undefined future work; each file responsibility is named.
- Type consistency: task names and file paths match the component map and approved design.
