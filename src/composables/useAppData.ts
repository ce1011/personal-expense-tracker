import { computed, readonly, shallowRef } from 'vue'

import { clearRequestCache, invalidateRequestCache } from '@/api/requestCache'
import {
  createExpense,
  createIncome,
  createSaving,
  createSavingChallenge,
  createAssetAccount,
  createAccountBalance,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  deleteSavingChallenge,
  deleteAssetAccount as removeAssetAccount,
  exportBackup,
  getDashboardContext,
  getRecoverySnapshotSummaries,
  getRestorePreview,
  importTransactions,
  replaceAllDataWithSnapshot,
  restoreFromSnapshot,
  copyCycleToNext,
  saveCycle,
  saveExpenseCategory,
  saveIncomeCategory,
  saveTargetLimit,
  saveTrip,
  setActiveTripId,
  softDeleteExpenseCategory,
  softDeleteIncomeCategory,
  updateExpense,
  updateIncome,
  updateSaving,
  updateSavingChallenge,
  updateAssetAccount as persistAssetAccount,
} from '@/services/appDataService'
import type { DashboardData } from '@/api/types'
import type { ImportTransactionRecord } from '@/lib/transactionImport'
import type {
  AppDataPayload,
  CategoryDraft,
  CycleDraft,
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SavingChallenge,
  SavingDraft,
  SupportedCurrency,
  TripDraft,
  TripSession,
  AccountDraft,
  AccountBalanceDraft,
} from '@/types/app-data'

/**
 * Shared app context + mutation actions.
 *
 * This is intentionally slim. Per the per-page data architecture, pages no
 * longer load the whole dataset here — each page fetches its own aggregate via
 * a dedicated composable (`useDashboardData`, `useTransactionsQuery`, ...). This
 * store only holds the small cross-cutting "context" the app shell and the
 * quick-add sheet need everywhere:
 *
 * - expense / income categories (quick-add pickers, category chips)
 * - trips + active trip id (header trip-mode switch, default trip on quick-add)
 * - display currency + FX rates (quick-add currency conversion)
 * - saving challenges (quick-add saving target)
 *
 * Every mutation invalidates the matching request-cache scopes and bumps their
 * reactive versions so open pages re-fetch only affected aggregates.
 */

export interface AppContext {
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  activeExpenseCategories: ExpenseCategory[]
  activeIncomeCategories: IncomeCategory[]
  trips: TripSession[]
  activeTripId: string
  activeTrip?: TripSession
  currency: string
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate: string
  savingChallenges: SavingChallenge[]
}

const EMPTY_CONTEXT: AppContext = {
  expenseCategories: [],
  incomeCategories: [],
  activeExpenseCategories: [],
  activeIncomeCategories: [],
  trips: [],
  activeTripId: '',
  activeTrip: undefined,
  currency: 'HKD',
  fxRateMap: new Map<SupportedCurrency, number>([['HKD', 1]]),
  latestFxDate: '',
  savingChallenges: [],
}

const context = shallowRef<AppContext>(EMPTY_CONTEXT)

const loading = shallowRef(false)
const error = shallowRef('')
const pendingActions = shallowRef(0)
const lastSyncedAt = shallowRef<number | undefined>(undefined)
/** Bumped on every successful mutation; pages watch their relevant scope. */
const contextVersion = shallowRef(0)
const mutationVersions = {
  dashboard: shallowRef(0),
  transactions: shallowRef(0),
  budgets: shallowRef(0),
  categoryBudget: shallowRef(0),
  fixedExpenses: shallowRef(0),
  trips: shallowRef(0),
  monthlySnapshot: shallowRef(0),
  historyReview: shallowRef(0),
}

export type AppDataScope = keyof typeof mutationVersions
const ALL_DATA_SCOPES = Object.keys(mutationVersions) as AppDataScope[]
const recoverySnapshots = shallowRef<
  Array<{ snapshotId: string; createdAt: number; reason: string }>
>([])

// Context requests belong to an authenticated session. A generation prevents a
// response for the previous account from replacing the current account's data.
let contextGeneration = 0
let contextRefreshPromise: Promise<void> | null = null

/** Clear all auth-scoped data before logout, 401 teardown, or account switch. */
export function clearAppContext(): void {
  contextGeneration += 1
  contextRefreshPromise = null
  clearRequestCache()
  context.value = EMPTY_CONTEXT
  recoverySnapshots.value = []
  loading.value = false
  pendingActions.value = 0
  lastSyncedAt.value = undefined
  error.value = ''
}

/** Initialize the shared context for the current authenticated account. */
export function initializeAppContext(): Promise<void> {
  return refreshAppContext()
}

function hydrateAppContext(data: DashboardData): void {
  const expenseCategories = data.expenseCategories
  const incomeCategories = data.incomeCategories
  const activeTripId = data.trips.some((trip) => trip.trip_id === data.activeTripId)
    ? data.activeTripId
    : ''
  const rates = new Map<SupportedCurrency, number>([['HKD', 1]])
  for (const [currencyCode, rate] of Object.entries(data.fxRateMap)) {
    if (rate > 0) {
      rates.set(currencyCode as SupportedCurrency, rate)
    }
  }

  context.value = {
    expenseCategories,
    incomeCategories,
    activeExpenseCategories: expenseCategories.filter((category) => !category.deleted),
    activeIncomeCategories: incomeCategories.filter((category) => !category.deleted),
    trips: data.trips,
    activeTripId,
    activeTrip: data.trips.find((trip) => trip.trip_id === activeTripId),
    currency: data.currency,
    fxRateMap: rates,
    latestFxDate: data.latestFxDate,
    savingChallenges: data.savingChallenges,
  }
}

async function refreshAppContext(): Promise<void> {
  if (contextRefreshPromise) {
    return contextRefreshPromise
  }

  const generation = contextGeneration
  const refreshPromise = (async () => {
    loading.value = true
    error.value = ''

    try {
      const dashboard = await getDashboardContext()

      // The account may have changed while the requests were in flight.
      if (generation !== contextGeneration) {
        return
      }

      hydrateAppContext(dashboard)
      lastSyncedAt.value = Date.now()
    } catch (caught) {
      if (generation === contextGeneration) {
        error.value = caught instanceof Error ? caught.message : 'Unable to load app data'
      }
    } finally {
      if (generation === contextGeneration) {
        loading.value = false
      }
    }
  })()

  contextRefreshPromise = refreshPromise
  try {
    await refreshPromise
  } finally {
    if (contextRefreshPromise === refreshPromise) {
      contextRefreshPromise = null
    }
  }
}

export function useAppData() {
  const expenseCategories = computed(() => context.value.expenseCategories)
  const incomeCategories = computed(() => context.value.incomeCategories)
  const activeExpenseCategories = computed(() => context.value.activeExpenseCategories)
  const activeIncomeCategories = computed(() => context.value.activeIncomeCategories)
  const trips = computed(() => context.value.trips)
  const activeTripId = computed(() => context.value.activeTripId)
  const activeTrip = computed(() => context.value.activeTrip)
  const currency = computed(() => context.value.currency)
  const fxRateMap = computed(() => context.value.fxRateMap)
  const latestFxDate = computed(() => context.value.latestFxDate)
  const savingChallenges = computed(() => context.value.savingChallenges)

  /** Load the small shared context (called after authentication). */
  async function refreshContext(): Promise<void> {
    await refreshAppContext()
  }

  /** Back-compat alias: the app shell calls `refresh()` on boot. */
  async function refresh(): Promise<void> {
    await refreshContext()
  }

  /**
   * Run a mutation, then notify open pages to re-fetch their own aggregates.
   * Most mutations only bump `contextVersion`; ones that can change the shared
   * context (categories, trips, challenges, active trip) also re-fetch it.
   */
  async function withAction<T>(
    action: () => Promise<T>,
    options: { reloadContext?: boolean; scopes?: AppDataScope[] } = {},
  ): Promise<T> {
    error.value = ''
    pendingActions.value += 1

    try {
      const result = await action()

      const scopes = options.scopes
      if (scopes?.length) {
        invalidateRequestCache(scopes)
      } else {
        clearRequestCache()
      }

      contextVersion.value += 1
      for (const scope of scopes ?? []) {
        mutationVersions[scope].value += 1
      }

      if (options.reloadContext) {
        await refreshContext()
      }

      lastSyncedAt.value = Date.now()
      return result
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to save changes'
      throw caught
    } finally {
      pendingActions.value = Math.max(0, pendingActions.value - 1)
    }
  }

  function requireTrip(tripId: string): TripSession {
    const trip = context.value.trips.find((entry) => entry.trip_id === tripId)

    if (!trip) {
      throw new Error(`Unknown trip_id: ${tripId}`)
    }

    return trip
  }

  return {
    // Shared context (read-only).
    context: readonly(context),
    expenseCategories,
    incomeCategories,
    activeExpenseCategories,
    activeIncomeCategories,
    trips,
    activeTripId,
    activeTrip,
    currency,
    fxRateMap,
    latestFxDate,
    savingChallenges,

    // State.
    loading: readonly(loading),
    error: readonly(error),
    pendingActions: readonly(pendingActions),
    lastSyncedAt: readonly(lastSyncedAt),
    contextVersion: readonly(contextVersion),
    mutationVersion: (scope: AppDataScope) => readonly(mutationVersions[scope]),
    recoverySnapshots: readonly(recoverySnapshots),

    // Lifecycle.
    refresh,
    refreshContext,
    hydrateContext: hydrateAppContext,

    // Transaction mutations (do not reload shared context).
    addExpense: (draft: ExpenseDraft) =>
      withAction(() => createExpense(draft), {
        scopes: [
          'dashboard',
          'transactions',
          'categoryBudget',
          'fixedExpenses',
          'trips',
          'monthlySnapshot', 'historyReview',
        ],
      }),
    addIncome: (draft: IncomeDraft) =>
      withAction(() => createIncome(draft), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    addSaving: (draft: SavingDraft) =>
      withAction(() => createSaving(draft), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    // Transaction mutations invalidate only aggregates that include transactions.
    updateExpense: (transactionId: string, draft: ExpenseDraft) =>
      withAction(() => updateExpense(transactionId, draft), {
        scopes: [
          'dashboard',
          'transactions',
          'categoryBudget',
          'fixedExpenses',
          'trips',
          'monthlySnapshot', 'historyReview',
        ],
      }),
    updateIncome: (transactionId: string, draft: IncomeDraft) =>
      withAction(() => updateIncome(transactionId, draft), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    updateSaving: (transactionId: string, draft: SavingDraft) =>
      withAction(() => updateSaving(transactionId, draft), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    deleteExpense: (transactionId: string) =>
      withAction(() => deleteExpense(transactionId), {
        scopes: [
          'dashboard',
          'transactions',
          'categoryBudget',
          'fixedExpenses',
          'trips',
          'monthlySnapshot', 'historyReview',
        ],
      }),
    deleteIncome: (transactionId: string) =>
      withAction(() => deleteIncome(transactionId), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    deleteSaving: (transactionId: string) =>
      withAction(() => deleteSaving(transactionId), {
        scopes: ['dashboard', 'transactions', 'trips', 'monthlySnapshot', 'historyReview'],
      }),
    importTransactions: (records: readonly ImportTransactionRecord[]) =>
      withAction(() => importTransactions(records), {
        scopes: ['dashboard', 'transactions', 'categoryBudget', 'trips', 'monthlySnapshot', 'historyReview'],
      }),

    // Budget cycle / target limits.
    saveCycle: (draft: CycleDraft, cycleId?: string) =>
      withAction(() => saveCycle(draft, cycleId), {
        scopes: ['dashboard', 'budgets', 'categoryBudget', 'fixedExpenses', 'monthlySnapshot', 'historyReview'],
      }),
    copyCycleToNext: (cycleId: string) =>
      withAction(() => copyCycleToNext(cycleId), {
        scopes: ['dashboard', 'budgets', 'categoryBudget', 'fixedExpenses', 'monthlySnapshot', 'historyReview'],
      }),
    saveTargetLimit: (cycleId: string, categoryId: string, amount: number) =>
      withAction(() => saveTargetLimit(cycleId, categoryId, amount), {
        scopes: ['dashboard', 'budgets', 'categoryBudget'],
      }),

    // Categories (reload shared context so pickers stay fresh).
    saveExpenseCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveExpenseCategory(draft, categoryId), {
        reloadContext: true,
        scopes: [
          'dashboard',
          'transactions',
          'budgets',
          'categoryBudget',
          'fixedExpenses',
          'monthlySnapshot', 'historyReview',
        ],
      }),
    saveIncomeCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveIncomeCategory(draft, categoryId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),
    deleteExpenseCategory: (categoryId: string) =>
      withAction(() => softDeleteExpenseCategory(categoryId), {
        reloadContext: true,
        scopes: [
          'dashboard',
          'transactions',
          'budgets',
          'categoryBudget',
          'fixedExpenses',
          'monthlySnapshot', 'historyReview',
        ],
      }),
    deleteIncomeCategory: (categoryId: string) =>
      withAction(() => softDeleteIncomeCategory(categoryId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),

    // Saving challenges (reload context; quick-add lists them).
    addSavingChallenge: (name: string, target_amount: number) =>
      withAction(() => createSavingChallenge(name, target_amount), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),
    updateSavingChallenge: (
      challengeId: string,
      draft: Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>,
    ) =>
      withAction(() => updateSavingChallenge(challengeId, draft), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),
    deleteSavingChallenge: (challengeId: string) =>
      withAction(() => deleteSavingChallenge(challengeId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),

    // Trips (reload context; header + quick-add read trips/active trip).
    addTrip: (draft: TripDraft) =>
      withAction(() => saveTrip(draft), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions', 'trips'],
      }),
    updateTrip: (tripId: string, draft: TripDraft) => {
      const trip = requireTrip(tripId)
      return withAction(
        () => saveTrip(draft, { trip_id: trip.trip_id, created_at: trip.created_at }),
        { reloadContext: true, scopes: ['dashboard', 'transactions', 'trips'] },
      )
    },
    completeTrip: (tripId: string) => {
      const trip = requireTrip(tripId)
      return withAction(
        () =>
          saveTrip(
            {
              name: trip.name,
              destination: trip.destination,
              start_date: trip.start_date,
              end_date: trip.end_date,
              budget_amount: trip.budget_amount,
              budget_currency: trip.budget_currency,
              status: 'completed',
              notes: trip.notes,
            },
            { trip_id: trip.trip_id, created_at: trip.created_at },
          ),
        { reloadContext: true, scopes: ['dashboard', 'transactions', 'trips'] },
      )
    },
    setActiveTrip: (tripId?: string) =>
      withAction(() => setActiveTripId(tripId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions', 'trips'],
      }),
    clearActiveTrip: () =>
      withAction(() => setActiveTripId(), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions', 'trips'],
      }),

    addAssetAccount: (draft: AccountDraft) =>
      withAction(() => createAssetAccount(draft), { scopes: ['historyReview'] }),
    updateAssetAccount: (accountId: string, draft: AccountDraft & { archived?: boolean }) =>
      withAction(() => persistAssetAccount(accountId, draft), { scopes: ['historyReview'] }),
    deleteAssetAccount: (accountId: string) =>
      withAction(() => removeAssetAccount(accountId), { scopes: ['historyReview'] }),
    addAccountBalance: (draft: AccountBalanceDraft) =>
      withAction(() => createAccountBalance(draft), { scopes: ['historyReview'] }),

    // Settings: backup / recovery (the only place the full payload is used).
    exportBackupPayload: () => exportBackup(),
    getRestorePreview,
    restorePayload: (payload: AppDataPayload) =>
      withAction(() => replaceAllDataWithSnapshot(payload), {
        reloadContext: true,
        scopes: ALL_DATA_SCOPES,
      }),
    restoreSnapshot: (snapshotId: string) =>
      withAction(() => restoreFromSnapshot(snapshotId), {
        reloadContext: true,
        scopes: ALL_DATA_SCOPES,
      }),
    loadRecoverySnapshots: async (): Promise<void> => {
      recoverySnapshots.value = await getRecoverySnapshotSummaries()
    },
  }
}

export type AppDataStore = ReturnType<typeof useAppData>
