import { computed, readonly, shallowRef } from 'vue'

import {
  createExpense,
  createIncome,
  createSaving,
  createSavingChallenge,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  deleteSavingChallenge,
  exportBackup,
  getActiveTripId,
  getCurrency,
  getFxContext,
  getRecoverySnapshotSummaries,
  getRestorePreview,
  importTransactions,
  listExpenseCategories,
  listIncomeCategories,
  listSavingChallenges,
  listTrips,
  replaceAllDataWithSnapshot,
  restoreFromSnapshot,
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
} from '@/services/appDataService'
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
 * Every mutation invalidates the context (via `contextVersion`) so any open
 * page re-fetches its own aggregate; mutations that touch transactions also
 * refresh the shared context (a trip/category may have been created inline).
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
}

export type AppDataScope = keyof typeof mutationVersions
const recoverySnapshots = shallowRef<
  Array<{ snapshotId: string; createdAt: number; reason: string }>
>([])

// Context requests belong to an authenticated session. A generation prevents a
// response for the previous account from replacing the current account's data.
let contextGeneration = 0
let contextRefreshPromise: Promise<void> | null = null

async function resolveActiveTrip(): Promise<string> {
  return (await getActiveTripId()) ?? ''
}

/** Clear all auth-scoped data before logout, 401 teardown, or account switch. */
export function clearAppContext(): void {
  contextGeneration += 1
  contextRefreshPromise = null
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

async function refreshAppContext(): Promise<void> {
  if (contextRefreshPromise) {
    return contextRefreshPromise
  }

  const generation = contextGeneration
  const refreshPromise = (async () => {
    loading.value = true
    error.value = ''

    try {
      const [sharedResult, fxResult] = await Promise.allSettled([
        Promise.all([
          listExpenseCategories(),
          listIncomeCategories(),
          listTrips(),
          listSavingChallenges(),
          getCurrency(),
          resolveActiveTrip(),
        ]),
        getFxContext(),
      ])

      // The account may have changed while the requests were in flight.
      if (generation !== contextGeneration) {
        return
      }

      const fx =
        fxResult.status === 'fulfilled'
          ? fxResult.value
          : {
              fxRateMap: context.value.fxRateMap,
              latestFxDate: context.value.latestFxDate,
            }

      if (sharedResult.status === 'fulfilled') {
        const [expenseCats, incomeCats, tripList, challengeList, currencyCode, activeId] =
          sharedResult.value
        const activeTripIdValue = tripList.some((trip) => trip.trip_id === activeId) ? activeId : ''

        context.value = {
          expenseCategories: expenseCats,
          incomeCategories: incomeCats,
          activeExpenseCategories: expenseCats.filter((category) => !category.deleted),
          activeIncomeCategories: incomeCats.filter((category) => !category.deleted),
          trips: tripList,
          activeTripId: activeTripIdValue,
          activeTrip: tripList.find((trip) => trip.trip_id === activeTripIdValue),
          currency: currencyCode,
          fxRateMap: fx.fxRateMap,
          latestFxDate: fx.latestFxDate,
          savingChallenges: challengeList,
        }
      } else if (fxResult.status === 'fulfilled') {
        context.value = {
          ...context.value,
          fxRateMap: fx.fxRateMap,
          latestFxDate: fx.latestFxDate,
        }
      }

      const failure =
        sharedResult.status === 'rejected'
          ? sharedResult.reason
          : fxResult.status === 'rejected'
            ? fxResult.reason
            : undefined
      if (failure !== undefined) {
        error.value = failure instanceof Error ? failure.message : 'Unable to load app data'
      } else {
        lastSyncedAt.value = Date.now()
      }
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
  async function withAction(
    action: () => Promise<void>,
    options: { reloadContext?: boolean; scopes?: AppDataScope[] } = {},
  ): Promise<void> {
    error.value = ''
    pendingActions.value += 1

    try {
      await action()

      contextVersion.value += 1
      for (const scope of options.scopes ?? []) {
        mutationVersions[scope].value += 1
      }

      if (options.reloadContext) {
        await refreshContext()
      }

      lastSyncedAt.value = Date.now()
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

    // Transaction mutations (do not reload shared context).
    addExpense: (draft: ExpenseDraft) =>
      withAction(() => createExpense(draft), {
        scopes: ['dashboard', 'transactions', 'categoryBudget', 'fixedExpenses', 'monthlySnapshot'],
      }),
    addIncome: (draft: IncomeDraft) =>
      withAction(() => createIncome(draft), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    addSaving: (draft: SavingDraft) =>
      withAction(() => createSaving(draft), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    // Transaction mutations invalidate only aggregates that include transactions.
    updateExpense: (transactionId: string, draft: ExpenseDraft) =>
      withAction(() => updateExpense(transactionId, draft), {
        scopes: ['dashboard', 'transactions', 'categoryBudget', 'fixedExpenses', 'monthlySnapshot'],
      }),
    updateIncome: (transactionId: string, draft: IncomeDraft) =>
      withAction(() => updateIncome(transactionId, draft), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    updateSaving: (transactionId: string, draft: SavingDraft) =>
      withAction(() => updateSaving(transactionId, draft), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    deleteExpense: (transactionId: string) =>
      withAction(() => deleteExpense(transactionId), {
        scopes: ['dashboard', 'transactions', 'categoryBudget', 'fixedExpenses', 'monthlySnapshot'],
      }),
    deleteIncome: (transactionId: string) =>
      withAction(() => deleteIncome(transactionId), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    deleteSaving: (transactionId: string) =>
      withAction(() => deleteSaving(transactionId), {
        scopes: ['dashboard', 'transactions', 'monthlySnapshot'],
      }),
    importTransactions: (records: readonly ImportTransactionRecord[]) =>
      withAction(() => importTransactions(records), {
        scopes: ['dashboard', 'transactions', 'categoryBudget', 'monthlySnapshot'],
      }),

    // Budget cycle / target limits.
    saveCycle: (draft: CycleDraft, cycleId?: string) =>
      withAction(() => saveCycle(draft, cycleId), {
        scopes: ['dashboard', 'budgets', 'categoryBudget', 'monthlySnapshot'],
      }),
    saveTargetLimit: (cycleId: string, categoryId: string, amount: number) =>
      withAction(() => saveTargetLimit(cycleId, categoryId, amount), {
        scopes: ['dashboard', 'budgets', 'categoryBudget'],
      }),

    // Categories (reload shared context so pickers stay fresh).
    saveExpenseCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveExpenseCategory(draft, categoryId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions', 'budgets', 'categoryBudget', 'fixedExpenses'],
      }),
    saveIncomeCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveIncomeCategory(draft, categoryId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions'],
      }),
    deleteExpenseCategory: (categoryId: string) =>
      withAction(() => softDeleteExpenseCategory(categoryId), {
        reloadContext: true,
        scopes: ['dashboard', 'transactions', 'budgets', 'categoryBudget', 'fixedExpenses'],
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
      withAction(() => setActiveTripId(tripId), { reloadContext: true }),
    clearActiveTrip: () => withAction(() => setActiveTripId(), { reloadContext: true }),

    // Settings: backup / recovery (the only place the full payload is used).
    exportBackupPayload: () => exportBackup(),
    getRestorePreview,
    restorePayload: (payload: AppDataPayload) =>
      withAction(() => replaceAllDataWithSnapshot(payload), { reloadContext: true }),
    restoreSnapshot: (snapshotId: string) =>
      withAction(() => restoreFromSnapshot(snapshotId), { reloadContext: true }),
    loadRecoverySnapshots: async (): Promise<void> => {
      recoverySnapshots.value = await getRecoverySnapshotSummaries()
    },
  }
}

export type AppDataStore = ReturnType<typeof useAppData>
