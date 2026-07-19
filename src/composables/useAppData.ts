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

const context = shallowRef<AppContext>({
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
})

const loading = shallowRef(false)
const error = shallowRef('')
/** Bumped on every successful mutation; pages watch this to re-fetch. */
const contextVersion = shallowRef(0)
const recoverySnapshots = shallowRef<
  Array<{ snapshotId: string; createdAt: number; reason: string }>
>([])

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

  /** Load the small shared context (called once on app boot). */
  async function refreshContext(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const [expenseCats, incomeCats, tripList, challengeList, currencyCode, fx, activeId] =
        await Promise.all([
          listExpenseCategories(),
          listIncomeCategories(),
          listTrips(),
          listSavingChallenges(),
          getCurrency(),
          getFxContext(),
          resolveActiveTrip(),
        ])

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
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load app data'
    } finally {
      loading.value = false
    }
  }

  /** Back-compat alias: the app shell calls `refresh()` on boot. */
  async function refresh(): Promise<void> {
    await refreshContext()
  }

  async function resolveActiveTrip(): Promise<string> {
    return (await getActiveTripId()) ?? ''
  }

  /**
   * Run a mutation, then notify open pages to re-fetch their own aggregates.
   * Most mutations only bump `contextVersion`; ones that can change the shared
   * context (categories, trips, challenges, active trip) also re-fetch it.
   */
  async function withAction(
    action: () => Promise<void>,
    options: { reloadContext?: boolean } = {},
  ): Promise<void> {
    error.value = ''

    try {
      await action()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to save changes'
      throw caught
    }

    contextVersion.value += 1

    if (options.reloadContext) {
      await refreshContext()
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
    contextVersion: readonly(contextVersion),
    recoverySnapshots: readonly(recoverySnapshots),

    // Lifecycle.
    refresh,
    refreshContext,

    // Transaction mutations (do not reload shared context).
    addExpense: (draft: ExpenseDraft) => withAction(() => createExpense(draft)),
    addIncome: (draft: IncomeDraft) => withAction(() => createIncome(draft)),
    addSaving: (draft: SavingDraft) => withAction(() => createSaving(draft)),
    updateExpense: (transactionId: string, draft: ExpenseDraft) =>
      withAction(() => updateExpense(transactionId, draft)),
    updateIncome: (transactionId: string, draft: IncomeDraft) =>
      withAction(() => updateIncome(transactionId, draft)),
    updateSaving: (transactionId: string, draft: SavingDraft) =>
      withAction(() => updateSaving(transactionId, draft)),
    deleteExpense: (transactionId: string) => withAction(() => deleteExpense(transactionId)),
    deleteIncome: (transactionId: string) => withAction(() => deleteIncome(transactionId)),
    deleteSaving: (transactionId: string) => withAction(() => deleteSaving(transactionId)),
    importTransactions: (records: readonly ImportTransactionRecord[]) =>
      withAction(() => importTransactions(records)),

    // Budget cycle / target limits.
    saveCycle: (draft: CycleDraft, cycleId?: string) => withAction(() => saveCycle(draft, cycleId)),
    saveTargetLimit: (cycleId: string, categoryId: string, amount: number) =>
      withAction(() => saveTargetLimit(cycleId, categoryId, amount)),

    // Categories (reload shared context so pickers stay fresh).
    saveExpenseCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveExpenseCategory(draft, categoryId), { reloadContext: true }),
    saveIncomeCategory: (draft: CategoryDraft, categoryId?: string) =>
      withAction(() => saveIncomeCategory(draft, categoryId), { reloadContext: true }),
    deleteExpenseCategory: (categoryId: string) =>
      withAction(() => softDeleteExpenseCategory(categoryId), { reloadContext: true }),
    deleteIncomeCategory: (categoryId: string) =>
      withAction(() => softDeleteIncomeCategory(categoryId), { reloadContext: true }),

    // Saving challenges (reload context; quick-add lists them).
    addSavingChallenge: (name: string, target_amount: number) =>
      withAction(() => createSavingChallenge(name, target_amount), { reloadContext: true }),
    updateSavingChallenge: (
      challengeId: string,
      draft: Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>,
    ) => withAction(() => updateSavingChallenge(challengeId, draft), { reloadContext: true }),
    deleteSavingChallenge: (challengeId: string) =>
      withAction(() => deleteSavingChallenge(challengeId), { reloadContext: true }),

    // Trips (reload context; header + quick-add read trips/active trip).
    addTrip: (draft: TripDraft) => withAction(() => saveTrip(draft), { reloadContext: true }),
    updateTrip: (tripId: string, draft: TripDraft) => {
      const trip = requireTrip(tripId)
      return withAction(
        () => saveTrip(draft, { trip_id: trip.trip_id, created_at: trip.created_at }),
        { reloadContext: true },
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
        { reloadContext: true },
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
