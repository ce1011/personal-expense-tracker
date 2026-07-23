import { treaty } from '@elysiajs/eden'

import { cachedRequest, requestCacheKey } from './requestCache'
import { getToken, notifyUnauthorized } from './tokenStore'
import type {
  AppDataPayload,
  AuthResponse,
  BudgetCycle,
  BudgetsSummary,
  CategoryBudgetSummary,
  ChallengeBody,
  CycleBody,
  DashboardData,
  ExpenseBody,
  ExpenseCategory,
  ExpenseTransaction,
  FixedExpensesSummary,
  ImportBody,
  IncomeBody,
  IncomeCategory,
  IncomeTransaction,
  LoginBody,
  MonthlySnapshotSummary,
  RegisterBody,
  SavingBody,
  SavingChallenge,
  SavingRecord,
  SettingBody,
  SnapshotSummaryRecord,
  TargetExpenseBody,
  TargetExpenseLimit,
  TransactionsQueryParams,
  TransactionsQueryResult,
  TripBody,
  TripSession,
  TripsSummary,
} from './types'
import type { AppSetting, FxRateRecord } from '@/types/app-data'

/**
 * Eden Treaty client for the Elysia backend.
 *
 * The backend package is not importable by name from this repo (it exposes no
 * `exports`), so we create the client from the base URL string and layer a
 * typed request surface (`api`) on top of the runtime proxy. The Bearer token
 * is attached through the global async `headers` hook so every authenticated
 * call picks it up automatically.
 *
 * Base URL resolution:
 * - `VITE_API_URL` (absolute origin) when set — e.g. a deployed API. The URL is
 *   used as-is, so backend routes are reached at `<origin>/auth`, ...
 * - The app's own origin by default (same-origin). In dev, `vite.config.ts`
 *   proxies `/api/*` to `http://localhost:3000/*` with the `/api` prefix removed,
 *   so the SPA calls the backend without CORS by prefixing every route below
 *   with `/api`. Eden prepends `https://` to any domain string without a scheme,
 *   so `window.location.origin` is used to keep requests on the current origin.
 */
const baseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api')

const AGGREGATE_CACHE_TTL_MS = 20_000
const TRANSACTIONS_CACHE_TTL_MS = 10_000

/** API path prefixes used by the backend. */
export const API_PREFIXES = [
  '/auth',
  '/categories',
  '/transactions',
  '/cycles',
  '/target-expenses',
  '/saving-challenges',
  '/trips',
  '/settings',
  '/data',
  '/fx-rates',
  '/dashboard',
  '/budgets',
  '/category-budget',
  '/fixed-expenses',
  '/monthly-snapshot',
] as const

interface TreatyResult<T> {
  data: T | null
  error: { status: number; value: unknown } | null
  status: number
}

/** The untyped Eden proxy. Each property chain builds a path; verb methods send. */
// The runtime is a Proxy that fabricates arbitrary nested call chains, which
// TypeScript cannot express without the backend's Elysia `App` type. The typed
// `api` surface below is the contract the rest of the app uses.
/* eslint-disable @typescript-eslint/no-explicit-any */
type TreatyProxy = Record<string | symbol, any>
/* eslint-enable @typescript-eslint/no-explicit-any */

const http = treaty(baseUrl, {
  // API response types describe wire-format strings. Eden otherwise converts
  // date-looking strings (including FX `source_date`) into Date instances.
  parseDate: false,
  headers: () => {
    const token = getToken()
    return token ? { authorization: `Bearer ${token}` } : {}
  },
}) as TreatyProxy

async function request<T>(promise: Promise<TreatyResult<T>>): Promise<T> {
  const { data, error, status } = await promise

  if (error || status < 200 || status >= 300) {
    if (status === 401) notifyUnauthorized()
    throw new ApiError(status, error?.value ?? data)
  }

  return data as T
}

/** Error thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly value: unknown,
  ) {
    super(extractMessage(status, value))
    this.name = 'ApiError'
  }
}

function extractMessage(status: number, value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const envelope = record.error
    if (envelope && typeof envelope === 'object') {
      const message = (envelope as Record<string, unknown>).message
      if (typeof message === 'string') {
        return message
      }
    }
    if (typeof record.message === 'string') {
      return record.message
    }
  }

  if (status === 401) {
    return 'Authentication required'
  }

  return `Request failed with status ${status}`
}

/** Typed request surface over the Eden proxy (mirrors `backend/src/routes`). */
export const api = {
  auth: {
    register: (body: RegisterBody) => request<AuthResponse>(http.auth.register.post(body)),
    login: (body: LoginBody) => request<AuthResponse>(http.auth.login.post(body)),
    me: () => request<{ user: { id: string; email: string } }>(http.auth.me.get()),
    logout: () => request<{ ok: boolean }>(http.auth.logout.post()),
  },
  categories: {
    expenses: {
      list: () => request<ExpenseCategory[]>(http.categories.expenses.get()),
      create: (body: ExpenseCategoryInput) =>
        request<ExpenseCategory>(http.categories.expenses.post(body)),
      update: (id: string, body: ExpenseCategoryInput) =>
        request<ExpenseCategory>(http.categories.expenses({ id }).put(body)),
      remove: (id: string) => request<ExpenseCategory>(http.categories.expenses({ id }).delete()),
    },
    incomes: {
      list: () => request<IncomeCategory[]>(http.categories.incomes.get()),
      create: (body: ExpenseCategoryInput) =>
        request<IncomeCategory>(http.categories.incomes.post(body)),
      update: (id: string, body: ExpenseCategoryInput) =>
        request<IncomeCategory>(http.categories.incomes({ id }).put(body)),
      remove: (id: string) => request<IncomeCategory>(http.categories.incomes({ id }).delete()),
    },
  },
  transactions: {
    expenses: {
      list: () => request<ExpenseTransaction[]>(http.transactions.expenses.get()),
      create: (body: ExpenseBody) =>
        request<ExpenseTransaction>(http.transactions.expenses.post(body)),
      update: (id: string, body: ExpenseBody) =>
        request<ExpenseTransaction>(http.transactions.expenses({ id }).put(body)),
      remove: (id: string) =>
        request<{ deleted: string }>(http.transactions.expenses({ id }).delete()),
    },
    incomes: {
      list: () => request<IncomeTransaction[]>(http.transactions.incomes.get()),
      create: (body: IncomeBody) =>
        request<IncomeTransaction>(http.transactions.incomes.post(body)),
      update: (id: string, body: IncomeBody) =>
        request<IncomeTransaction>(http.transactions.incomes({ id }).put(body)),
      remove: (id: string) =>
        request<{ deleted: string }>(http.transactions.incomes({ id }).delete()),
    },
    savings: {
      list: () => request<SavingRecord[]>(http.transactions.savings.get()),
      create: (body: SavingBody) => request<SavingRecord>(http.transactions.savings.post(body)),
      update: (id: string, body: SavingBody) =>
        request<SavingRecord>(http.transactions.savings({ id }).put(body)),
      remove: (id: string) =>
        request<{ deleted: string }>(http.transactions.savings({ id }).delete()),
    },
    import: (body: ImportBody) =>
      request<{ imported: number }>(http.transactions.import.post(body)),
  },
  cycles: {
    list: () => request<BudgetCycle[]>(http.cycles.get()),
    create: (body: CycleBody) => request<BudgetCycle>(http.cycles.post(body)),
    update: (id: string, body: Partial<CycleBody>) =>
      request<BudgetCycle>(http.cycles({ id }).put(body)),
    remove: (id: string) => request<BudgetCycle>(http.cycles({ id }).delete()),
  },
  targetExpenses: {
    list: (cycleId?: string) =>
      request<TargetExpenseLimit[]>(
        cycleId
          ? http['target-expenses'].get(undefined, { query: { cycle_id: cycleId } })
          : http['target-expenses'].get(),
      ),
    upsert: (body: TargetExpenseBody) =>
      request<TargetExpenseLimit>(http['target-expenses'].put(body)),
    remove: (id: string) => request<TargetExpenseLimit>(http['target-expenses']({ id }).delete()),
  },
  savingChallenges: {
    list: () => request<SavingChallenge[]>(http['saving-challenges'].get()),
    create: (body: { name: string; target_amount: number }) =>
      request<SavingChallenge>(http['saving-challenges'].post(body)),
    update: (id: string, body: ChallengeBody) =>
      request<SavingChallenge>(http['saving-challenges']({ id }).put(body)),
    remove: (id: string) => request<SavingChallenge>(http['saving-challenges']({ id }).delete()),
  },
  trips: {
    list: () => request<TripSession[]>(http.trips.get()),
    create: (body: TripBody) => request<TripSession>(http.trips.post(body)),
    update: (id: string, body: TripBody) => request<TripSession>(http.trips({ id }).put(body)),
    remove: (id: string) => request<TripSession>(http.trips({ id }).delete()),
  },
  settings: {
    list: () => request<AppSetting[]>(http.settings.get()),
    set: (name: string, body: SettingBody) =>
      request<AppSetting>(http.settings({ name }).put(body)),
    remove: (name: string) => request<{ deleted: boolean }>(http.settings({ name }).delete()),
  },
  data: {
    export: () => request<AppDataPayload>(http.data.export.get()),
    import: (body: AppDataPayload) => request<{ ok: boolean }>(http.data.import.post(body)),
    sync: () => request<AppDataPayload>(http.data.sync.get()),
    snapshots: {
      list: () => request<SnapshotSummaryRecord[]>(http.data.snapshots.get()),
      get: (id: string) => request<SnapshotDetail>(http.data.snapshots({ id }).get()),
      restore: (id: string) => request<{ ok: boolean }>(http.data.snapshots({ id }).restore.post()),
      remove: (id: string) => request<{ ok: boolean }>(http.data.snapshots({ id }).delete()),
    },
  },
  fxRates: {
    list: () => request<FxRateRecord[]>(http['fx-rates'].get()),
    refresh: () => request<FxRateRecord[]>(http['fx-rates'].refresh.post()),
  },
  dashboard: {
    get: () =>
      cachedRequest(
        'dashboard',
        () => request<DashboardData>(http.dashboard.get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['dashboard'] },
      ),
  },
  transactionsQuery: {
    list: (params: TransactionsQueryParams = {}) =>
      cachedRequest(
        requestCacheKey('transactions', params),
        () => request<TransactionsQueryResult>(http.transactions.get({ query: params })),
        { ttlMs: TRANSACTIONS_CACHE_TTL_MS, tags: ['transactions'] },
      ),
  },
  budgets: {
    summary: () =>
      cachedRequest(
        'budgets-summary',
        () => request<BudgetsSummary>(http.budgets.summary.get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['budgets'] },
      ),
  },
  categoryBudget: {
    summary: () =>
      cachedRequest(
        'category-budget-summary',
        () => request<CategoryBudgetSummary>(http['category-budget'].summary.get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['categoryBudget'] },
      ),
  },
  fixedExpenses: {
    summary: () =>
      cachedRequest(
        'fixed-expenses-summary',
        () => request<FixedExpensesSummary>(http['fixed-expenses'].summary.get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['fixedExpenses'] },
      ),
  },
  tripsSummary: {
    get: () =>
      cachedRequest(
        'trips-summary',
        () => request<TripsSummary>(http.trips.summary.get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['trips'] },
      ),
  },
  monthlySnapshot: {
    get: () =>
      cachedRequest(
        'monthly-snapshot',
        () => request<MonthlySnapshotSummary>(http['monthly-snapshot'].get()),
        { ttlMs: AGGREGATE_CACHE_TTL_MS, tags: ['monthlySnapshot'] },
      ),
  },
}

export interface ExpenseCategoryInput {
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
}

export interface SnapshotDetail {
  snapshot_id: string
  created_at: number
  reason: string
  payload: AppDataPayload
}

// Re-export for convenience.
export { getToken }
