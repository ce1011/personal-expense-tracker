# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

This project uses **Bun** as its package manager and runtime.

| Command | Description |
| --- | --- |
| `bun install` | Install dependencies. |
| `bun dev` | Start the Vite dev server with hot reload. |
| `bun run build` | Type-check with `vue-tsc` and build for production to `dist/`. |
| `bun preview` | Preview the production build locally. |
| `bun test:unit` | Run all Vitest unit tests (jsdom environment, configured in `vite.config.ts`). |
| `bun test:unit src/lib/date.test.ts` | Run a single test file. |
| `bun test:unit run` | Run tests once without watch mode. |
| `bun lint` | Run all linters (`oxlint --fix` then `eslint --fix --cache`). |
| `bun run lint:oxlint` | Run only Oxlint. |
| `bun run lint:eslint` | Run only ESLint. |
| `bun format` | Format `src/` with `oxfmt`. |

The build is deployed to GitHub Pages via `.github/workflows/static.yml`. `vite.config.ts` sets `base: '/personal-expense-tracker/'`, so assets are loaded from that path.

## Project architecture

### Stack

- **Vue 3** with Composition API and `<script setup>`.
- **Vite** for dev/build tooling, with Vue DevTools and Tailwind CSS v4 plugins.
- **Pinia** is installed but largely unused; the app uses a custom composable for global state.
- **Vue Router** for navigation.
- **Tailwind CSS v4** via `@tailwindcss/vite` and `@import "tailwindcss"` in `src/assets/main.css`.
- **Dexie.js** wrapper around IndexedDB for local persistence.
- **Oxlint + ESLint** for linting, **oxfmt** for formatting.

### State and data flow

The app centers around a single global state composable:

- **`src/composables/useAppData.ts`** exposes reactive, readonly refs and action wrappers. It is used by `App.vue` and most views/components as the single source of truth. It computes derived state such as the current budget cycle, remaining budget, recent transactions, FX conversions, and active trip/session breakdowns.
- **`src/services/appDataService.ts`** is the persistence layer. It talks to Dexie, seeds initial data, syncs FX rates from a public API, and provides CRUD operations for cycles, transactions, categories, trips, and settings.
- **`src/db/database.ts`** defines the Dexie schema, version 3 indexes, and `createInitialPayload()` defaults (including default expense/income categories and an initial HKD budget cycle).
- **`src/types/app-data.ts`** contains the shared domain types: `AppDataPayload`, `BudgetCycle`, `TripSession`, transaction records, drafts, etc.

Data flow is: view/component → `useAppData` action → `appDataService` → Dexie → `useAppData.refresh()` reloads the whole `AppDataPayload` and updates computed state.

### Key domain concepts

- **Budget cycles** (`cycles` table): Each cycle has a `cycle_code` (e.g. `2025-07`) and an `income_day`. The current cycle is `data.value.cycles[0]` (sorted newest first). `src/lib/budgetCycle.ts` calculates the cycle window from that.
- **Transactions**: stored separately as `expenses`, `incomes`, and `savings`. `useAppData` merges them into `combinedTransactions` for display. Amounts are persisted in HKD; original currency/amount/exchange rate are stored for trips/multi-currency support.
- **Categories**: `expenseCategories` and `incomeCategories` support soft deletes via a `deleted` flag. `src/lib/savingCategories.ts` defines fixed saving categories.
- **Trips**: `TripSession` records have status `planned | active | completed`. An `active_trip_id` setting lets the user filter transactions by trip. Trip mode UI exists in `AppShell.vue` but is currently hidden.
- **FX rates**: `appDataService.syncFxRatesIfNeeded()` fetches HKD-based rates from `@fawazahmed0/currency-api` once per day and caches them in IndexedDB. Conversions are handled in `src/lib/fx.ts`.
- **Import**: `src/lib/transactionImport.ts` parses a JSON array of transaction records and validates categories, currencies, timestamps, and FX rates before persisting via `importTransactions`.

### Testing

Tests are colocated with source files as `*.test.ts` (e.g. `src/lib/date.test.ts`). Vitest has no custom config file; it uses the default `vitest` CLI behavior. The project does not use a `__tests__` directory convention.

### Code style and linting

- TypeScript `noUncheckedIndexedAccess` is enabled in `tsconfig.app.json`.
- `oxfmt` is configured in `.oxfmtrc.json` with `semi: false` and `singleQuote: true`.
- ESLint config is in `eslint.config.ts` and extends Vue TypeScript + Oxlint rules.
- Path alias `@/` maps to `src/` in both Vite and TypeScript.

### Important files for orientation

- `src/main.ts` — Vue app bootstrap with Pinia and Router.
- `src/App.vue` — root component; loads `AppShell` and triggers `useAppData().refresh()` on mount.
- `src/router/index.ts` — route definitions for dashboard, transactions, import, budgets, categories, trips, and settings.
- `src/components/AppShell.vue` — responsive shell with navigation and cycle/trip summaries.
- `src/lib/backup.ts` — payload validation/import/export utilities used by settings and restore.
