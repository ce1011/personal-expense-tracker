import { computed, readonly, shallowRef } from 'vue'

import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import { getDaysUntilNextIncomeDay, startOfLocalDay } from '@/lib/date'
import { getCategoryAlerts } from '@/lib/dailyFinance/categoryAlerts'
import {
  getCycleFixedExpensesTotal,
  getUpcomingBills,
} from '@/lib/dailyFinance/recurringExpenses'
import { getSafeToSpend } from '@/lib/dailyFinance/safeToSpend'
import { getActiveChallenges } from '@/lib/dailyFinance/savingChallenges'
import { getWeeklyReview } from '@/lib/dailyFinance/weeklyReview'
import { getFrequentTransactions } from '@/lib/dailyFinance/quickAdd'
import { getMonthlySnapshot } from '@/lib/dailyFinance/monthlySnapshot'
import { getOverspendForecast } from '@/lib/dailyFinance/overspendForecast'
import { getSpendingStreak } from '@/lib/dailyFinance/spendingStreak'
import { getUnusualExpenseAlerts } from '@/lib/dailyFinance/unusualExpenses'
import { getDetectedRecurringExpenses } from '@/lib/dailyFinance/recurringExpenseDetection'
import {
  filterTransactionsByTrip,
  getTripBudgetHelper,
  getTripDailyBreakdown,
  getTripRemainingBudget,
  getTripSpentTotal,
} from '@/lib/trips'
import {
  createExpense,
  createIncome,
  createSaving,
  createSavingChallenge,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  deleteSavingChallenge,
  getRecoverySnapshotSummaries,
  getRestorePreview,
  importTransactions,
  loadAppData,
  replaceAllDataWithSnapshot,
  restoreFromSnapshot,
  saveCycle,
  saveExpenseCategory,
  saveIncomeCategory,
  saveTrip,
  setActiveTripId,
  saveTargetLimit,
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
  BudgetCycle,
  CategoryDraft,
  CombinedTransaction,
  CycleDraft,
  ExpenseDraft,
  ExpenseTransaction,
  IncomeDraft,
  IncomeTransaction,
  SavingChallenge,
  SavingDraft,
  SavingRecord,
  TripDraft,
  TripSession,
} from '@/types/app-data'

const emptyPayload: AppDataPayload = {
  cycles: [],
  expenseCategories: [],
  incomeCategories: [],
  expenses: [],
  incomes: [],
  targetExpenses: [],
  savings: [],
  settings: [],
  trips: [],
  fxRates: [],
  savingChallenges: [],
}

const data = shallowRef<AppDataPayload>(emptyPayload)
const loading = shallowRef(false)
const error = shallowRef('')
const recoverySnapshots = shallowRef<
  Array<{ snapshotId: string; createdAt: number; reason: string }>
>([])

export function useAppData() {
  const currentCycle = computed(() => data.value.cycles[0])
  const currentWindow = computed(() =>
    currentCycle.value
      ? getCycleWindow(currentCycle.value.cycle_code, currentCycle.value.income_day)
      : undefined,
  )
  const activeExpenseCategories = computed(() =>
    data.value.expenseCategories.filter((category) => !category.deleted),
  )
  const activeIncomeCategories = computed(() =>
    data.value.incomeCategories.filter((category) => !category.deleted),
  )
  const currency = computed(
    () => data.value.settings.find((setting) => setting.name === 'currency')?.parameter ?? 'HKD',
  )
  const fxRates = computed(() => data.value.fxRates ?? [])
  const fxRateMap = computed(() => {
    const entries = fxRates.value.map((rate) => [rate.currency_code, rate.rate_to_hkd] as const)
    return new Map([['HKD', 1] as const, ...entries])
  })
  const latestFxDate = computed(() => fxRates.value[0]?.source_date ?? '')
  const cycleExpenses = computed(() => {
    const window = currentWindow.value
    return window
      ? data.value.expenses.filter((expense) => isInCycleWindow(expense.date, window))
      : []
  })
  const categoryAlerts = computed(() =>
    currentWindow.value && currentCycle.value
      ? getCategoryAlerts(
          data.value.expenses,
          data.value.targetExpenses,
          activeExpenseCategories.value,
          currentWindow.value,
          currentCycle.value.cycle_id,
        )
      : [],
  )
  const cycleIncomes = computed(() => {
    const window = currentWindow.value
    return window ? data.value.incomes.filter((income) => isInCycleWindow(income.date, window)) : []
  })
  const cycleExpenseTotal = computed(() =>
    cycleExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  )
  const cycleSavingTotal = computed(() =>
    data.value.savings
      .filter((saving) =>
        currentWindow.value ? isInCycleWindow(saving.date, currentWindow.value) : false,
      )
      .reduce((sum, saving) => sum + saving.amount, 0),
  )
  const cycleIncomeTotal = computed(() =>
    cycleIncomes.value.reduce(
      (sum, income) => sum + income.amount,
      currentCycle.value?.income ?? 0,
    ),
  )
  const remainingBudget = computed(
    () => cycleIncomeTotal.value - cycleExpenseTotal.value - cycleSavingTotal.value,
  )
  const daysUntilNextIncome = computed(() =>
    currentCycle.value ? getDaysUntilNextIncomeDay(currentCycle.value.income_day) : 1,
  )
  const cycleFixedExpensesTotal = computed(() =>
    currentWindow.value ? getCycleFixedExpensesTotal(data.value.expenses, currentWindow.value) : 0,
  )
  const upcomingBills = computed(() => getUpcomingBills(data.value.expenses, Date.now(), 14))
  const savingChallenges = computed(() => data.value.savingChallenges ?? [])
  const activeChallenges = computed(() =>
    getActiveChallenges(savingChallenges.value, data.value.savings),
  )
  const weeklyReview = computed(() =>
    getWeeklyReview(combinedTransactions.value, activeExpenseCategories.value, Date.now()),
  )
  const quickAddSuggestions = computed(() =>
    getFrequentTransactions(combinedTransactions.value, 6, Date.now()),
  )
  const monthlySnapshot = computed(() =>
    getMonthlySnapshot(
      data.value.cycles,
      data.value.expenses.map((expense) => expenseToCombinedTransaction(expense)),
      data.value.incomes.map((income) => incomeToCombinedTransaction(income)),
      data.value.savings.map((saving) => savingToCombinedTransaction(saving)),
      activeExpenseCategories.value,
      Date.now(),
    ),
  )
  const overspendForecast = computed(() => {
    if (!currentWindow.value || !currentCycle.value) {
      return undefined
    }

    return getOverspendForecast({
      cycleWindow: currentWindow.value,
      remainingBudget: remainingBudget.value,
      cycleExpenseTotal: cycleExpenseTotal.value,
      fixedExpensesTotal: cycleFixedExpensesTotal.value,
      now: Date.now(),
    })
  })
  const spendingStreak = computed(() =>
    getSpendingStreak(combinedTransactions.value, {
      now: Date.now(),
      lowSpendThreshold: Math.max(20, Math.round(averageDailyBudgetUntilIncome.value * 0.35)),
      lookbackDays: 14,
    }),
  )
  const unusualExpenseAlerts = computed(() =>
    getUnusualExpenseAlerts(combinedTransactions.value, {
      now: Date.now(),
      lookbackDays: 30,
      recentDays: 7,
      minHistoryCount: 3,
      multiplierThreshold: 1.5,
    }),
  )
  const detectedRecurringExpenses = computed(() => getDetectedRecurringExpenses(data.value.expenses))
  const weeklyCashflowBrief = computed(() => weeklyReview.value.brief)
  const averageDailyBudgetUntilIncome = computed(
    () => remainingBudget.value / Math.max(1, daysUntilNextIncome.value),
  )
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
      fixedExpensesTotal: cycleFixedExpensesTotal.value,
      todaySpent: todaySpent.value,
      savingTarget: cycle.saving_target,
    })
  })
  const combinedTransactions = computed<CombinedTransaction[]>(() =>
    buildCombinedTransactions(data.value),
  )
  const recentTransactions = computed(() => combinedTransactions.value.slice(0, 8))
  const trips = computed(() =>
    [...(data.value.trips ?? [])].sort((left, right) => left.start_date - right.start_date),
  )
  const activeTripId = computed(() => {
    const tripId = data.value.settings.find(
      (setting) => setting.name === 'active_trip_id',
    )?.parameter

    if (!tripId) {
      return ''
    }

    return trips.value.some((trip) => trip.trip_id === tripId) ? tripId : ''
  })
  const activeTrip = computed(() => trips.value.find((trip) => trip.trip_id === activeTripId.value))
  const tripTransactions = computed(() =>
    filterTransactionsByTrip(combinedTransactions.value, activeTripId.value || undefined),
  )
  const tripExpenses = computed(() =>
    tripTransactions.value.filter((transaction) => transaction.kind === 'expense'),
  )
  const tripIncomes = computed(() =>
    tripTransactions.value.filter((transaction) => transaction.kind === 'income'),
  )
  const tripSavings = computed(() =>
    tripTransactions.value.filter((transaction) => transaction.kind === 'saving'),
  )
  const unassignedTransactions = computed(() =>
    combinedTransactions.value.filter((transaction) => !transaction.trip_id),
  )
  const tripSpentTotal = computed(() => getTripSpentTotal(tripTransactions.value))
  const tripRemainingBudget = computed(() =>
    activeTrip.value
      ? getTripRemainingBudget(activeTrip.value.budget_amount, tripTransactions.value)
      : 0,
  )
  const tripDailyBreakdown = computed(() =>
    activeTrip.value ? getTripDailyBreakdown(activeTrip.value, tripTransactions.value) : [],
  )
  const tripBudgetHelper = computed(() =>
    activeTrip.value ? getTripBudgetHelper(activeTrip.value, tripTransactions.value, Date.now()) : undefined,
  )

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const loaded = await loadAppData()

      data.value = await normalizeActiveTripSetting(loaded)
      recoverySnapshots.value = await getRecoverySnapshotSummaries()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load app data'
    } finally {
      loading.value = false
    }
  }

  async function withRefresh(action: () => Promise<void>): Promise<void> {
    error.value = ''

    try {
      await action()
      await refresh()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to save changes'
      throw caught
    }
  }

  async function normalizeActiveTripSetting(payload: AppDataPayload): Promise<AppDataPayload> {
    const activeTripSetting = payload.settings.find((setting) => setting.name === 'active_trip_id')

    if (!activeTripSetting?.parameter) {
      return payload
    }

    const payloadTrips = payload.trips ?? []
    if (payloadTrips.some((trip) => trip.trip_id === activeTripSetting.parameter)) {
      return payload
    }

    await setActiveTripId()
    return loadAppData()
  }

  function requireTrip(tripId: string): TripSession {
    const trip = trips.value.find((entry) => entry.trip_id === tripId)

    if (!trip) {
      throw new Error(`Unknown trip_id: ${tripId}`)
    }

    return trip
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    currentCycle,
    currentWindow,
    activeExpenseCategories,
    activeIncomeCategories,
    currency,
    fxRates,
    fxRateMap,
    latestFxDate,
    cycleExpenses,
    categoryAlerts,
    cycleIncomes,
    cycleExpenseTotal,
    cycleSavingTotal,
    cycleIncomeTotal,
    remainingBudget,
    daysUntilNextIncome,
    cycleFixedExpensesTotal,
    upcomingBills,
    savingChallenges,
    activeChallenges,
    weeklyReview,
    quickAddSuggestions,
    monthlySnapshot,
    overspendForecast,
    spendingStreak,
    unusualExpenseAlerts,
    detectedRecurringExpenses,
    weeklyCashflowBrief,
    averageDailyBudgetUntilIncome,
    todaySpent,
    dailySafeToSpend,
    combinedTransactions,
    recentTransactions,
    trips,
    activeTripId,
    activeTrip,
    tripTransactions,
    tripExpenses,
    tripIncomes,
    tripSavings,
    unassignedTransactions,
    tripSpentTotal,
    tripRemainingBudget,
    tripDailyBreakdown,
    tripBudgetHelper,
    recoverySnapshots: readonly(recoverySnapshots),
    refresh,
    addExpense: (draft: ExpenseDraft) => withRefresh(() => createExpense(draft)),
    addIncome: (draft: IncomeDraft) => withRefresh(() => createIncome(draft)),
    addSaving: (draft: SavingDraft) => withRefresh(() => createSaving(draft)),
    addTrip: (draft: TripDraft) => withRefresh(() => saveTrip(draft)),
    updateTrip: (tripId: string, draft: TripDraft) => {
      const trip = requireTrip(tripId)

      return withRefresh(() =>
        saveTrip(draft, {
          trip_id: trip.trip_id,
          created_at: trip.created_at,
        }),
      )
    },
    completeTrip: (tripId: string) => {
      const trip = requireTrip(tripId)

      return withRefresh(() =>
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
          {
            trip_id: trip.trip_id,
            created_at: trip.created_at,
          },
        ),
      )
    },
    setActiveTrip: (tripId?: string) => withRefresh(() => setActiveTripId(tripId)),
    clearActiveTrip: () => withRefresh(() => setActiveTripId()),
    importTransactions: (records: readonly ImportTransactionRecord[]) =>
      withRefresh(() => importTransactions(records)),
    updateExpense: (transactionId: string, draft: ExpenseDraft) =>
      withRefresh(() => updateExpense(transactionId, draft)),
    updateIncome: (transactionId: string, draft: IncomeDraft) =>
      withRefresh(() => updateIncome(transactionId, draft)),
    updateSaving: (transactionId: string, draft: SavingDraft) =>
      withRefresh(() => updateSaving(transactionId, draft)),
    deleteExpense: (transactionId: string) => withRefresh(() => deleteExpense(transactionId)),
    deleteIncome: (transactionId: string) => withRefresh(() => deleteIncome(transactionId)),
    deleteSaving: (transactionId: string) => withRefresh(() => deleteSaving(transactionId)),
    addSavingChallenge: (name: string, target_amount: number) =>
      withRefresh(() => createSavingChallenge(name, target_amount)),
    updateSavingChallenge: (
      challengeId: string,
      draft: Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>,
    ) => withRefresh(() => updateSavingChallenge(challengeId, draft)),
    deleteSavingChallenge: (challengeId: string) =>
      withRefresh(() => deleteSavingChallenge(challengeId)),
    saveCycle: (draft: CycleDraft, cycleId?: string) =>
      withRefresh(() => saveCycle(draft, cycleId)),
    saveTargetLimit: (cycleId: string, categoryId: string, amount: number) =>
      withRefresh(() => saveTargetLimit(cycleId, categoryId, amount)),
    saveExpenseCategory: (draft: CategoryDraft, categoryId?: string) =>
      withRefresh(() => saveExpenseCategory(draft, categoryId)),
    saveIncomeCategory: (draft: CategoryDraft, categoryId?: string) =>
      withRefresh(() => saveIncomeCategory(draft, categoryId)),
    deleteExpenseCategory: (categoryId: string) =>
      withRefresh(() => softDeleteExpenseCategory(categoryId)),
    deleteIncomeCategory: (categoryId: string) =>
      withRefresh(() => softDeleteIncomeCategory(categoryId)),
    restorePayload: (payload: AppDataPayload) => withRefresh(() => replaceAllDataWithSnapshot(payload)),
    getRestorePreview,
    restoreSnapshot: (snapshotId: string) => withRefresh(() => restoreFromSnapshot(snapshotId)),
  }
}

export function getCycleById(cycles: BudgetCycle[], cycleId: string): BudgetCycle | undefined {
  return cycles.find((cycle) => cycle.cycle_id === cycleId)
}

export function buildCombinedTransactions(payload: AppDataPayload): CombinedTransaction[] {
  return [
    ...payload.expenses.map((expense) => expenseToCombinedTransaction(expense)),
    ...payload.incomes.map((income) => incomeToCombinedTransaction(income)),
    ...payload.savings.map((saving) => savingToCombinedTransaction(saving)),
  ].sort((a, b) => b.date - a.date)
}

function expenseToCombinedTransaction(expense: ExpenseTransaction): CombinedTransaction {
  return {
    id: expense.transaction_id,
    kind: 'expense',
    category_id: expense.category_id,
    name: expense.name,
    amount: expense.amount,
    date: expense.date,
    trip_id: expense.trip_id,
    original_currency: expense.original_currency,
    original_amount: expense.original_amount,
    exchange_rate_hkd: expense.exchange_rate_hkd,
    recurring: expense.recurring,
    recurring_frequency: expense.recurring_frequency,
    recurring_day: expense.recurring_day,
  }
}

function incomeToCombinedTransaction(income: IncomeTransaction): CombinedTransaction {
  return {
    id: income.transaction_id,
    kind: 'income',
    category_id: income.category_id,
    name: income.name,
    amount: income.amount,
    date: income.date,
    trip_id: income.trip_id,
    original_currency: income.original_currency,
    original_amount: income.original_amount,
    exchange_rate_hkd: income.exchange_rate_hkd,
  }
}

function savingToCombinedTransaction(saving: SavingRecord): CombinedTransaction {
  return {
    id: saving.saving_id,
    kind: 'saving',
    category_id: saving.category_id ?? 'saving-cash',
    name: saving.description,
    amount: saving.amount,
    date: saving.date,
    trip_id: saving.trip_id,
    original_currency: saving.original_currency,
    original_amount: saving.original_amount,
    exchange_rate_hkd: saving.exchange_rate_hkd,
    challenge_id: saving.challenge_id,
  }
}
