import { computed, readonly, shallowRef } from 'vue'

import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import { getDaysUntilNextIncomeDay, startOfLocalDay } from '@/lib/date'
import { getSafeToSpend } from '@/lib/dailyFinance/safeToSpend'
import {
  filterTransactionsByTrip,
  getTripDailyBreakdown,
  getTripRemainingBudget,
  getTripSpentTotal,
} from '@/lib/trips'
import {
  createExpense,
  createIncome,
  createSaving,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  importTransactions,
  loadAppData,
  replaceAllData,
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
} from '@/services/appDataService'
import type { ImportTransactionRecord } from '@/lib/transactionImport'
import type {
  AppDataPayload,
  BudgetCycle,
  CategoryDraft,
  CombinedTransaction,
  CycleDraft,
  ExpenseDraft,
  IncomeDraft,
  SavingDraft,
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
}

const data = shallowRef<AppDataPayload>(emptyPayload)
const loading = shallowRef(false)
const error = shallowRef('')

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
    () =>
      data.value.settings.find((setting) => setting.name === 'currency')?.parameter ??
      'HKD',
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
  const cycleIncomes = computed(() => {
    const window = currentWindow.value
    return window ? data.value.incomes.filter((income) => isInCycleWindow(income.date, window)) : []
  })
  const cycleExpenseTotal = computed(() =>
    cycleExpenses.value.reduce((sum, expense) => sum + expense.amount, 0) +
    data.value.savings
      .filter((saving) => (currentWindow.value ? isInCycleWindow(saving.date, currentWindow.value) : false))
      .reduce((sum, saving) => sum + saving.amount, 0),
  )
  const cycleIncomeTotal = computed(() =>
    cycleIncomes.value.reduce((sum, income) => sum + income.amount, currentCycle.value?.income ?? 0),
  )
  const remainingBudget = computed(() => cycleIncomeTotal.value - cycleExpenseTotal.value)
  const daysUntilNextIncome = computed(() =>
    currentCycle.value ? getDaysUntilNextIncomeDay(currentCycle.value.income_day) : 1,
  )
  const averageDailyBudgetUntilIncome = computed(() =>
    remainingBudget.value / Math.max(1, daysUntilNextIncome.value),
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
      fixedExpensesTotal: 0,
      todaySpent: todaySpent.value,
      savingTarget: cycle.saving_target,
    })
  })
  const combinedTransactions = computed<CombinedTransaction[]>(() =>
    [
      ...data.value.expenses.map((expense) => ({
        id: expense.transaction_id,
        kind: 'expense' as const,
        category_id: expense.category_id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        trip_id: expense.trip_id,
        original_currency: expense.original_currency,
        original_amount: expense.original_amount,
        exchange_rate_hkd: expense.exchange_rate_hkd,
      })),
      ...data.value.incomes.map((income) => ({
        id: income.transaction_id,
        kind: 'income' as const,
        category_id: income.category_id,
        name: income.name,
        amount: income.amount,
        date: income.date,
        trip_id: income.trip_id,
        original_currency: income.original_currency,
        original_amount: income.original_amount,
        exchange_rate_hkd: income.exchange_rate_hkd,
      })),
      ...data.value.savings.map((saving) => ({
        id: saving.saving_id,
        kind: 'saving' as const,
        category_id: saving.category_id ?? 'saving-cash',
        name: saving.description,
        amount: saving.amount,
        date: saving.date,
        trip_id: saving.trip_id,
        original_currency: saving.original_currency,
        original_amount: saving.original_amount,
        exchange_rate_hkd: saving.exchange_rate_hkd,
      })),
    ].sort((a, b) => b.date - a.date),
  )
  const recentTransactions = computed(() => combinedTransactions.value.slice(0, 8))
  const trips = computed(() =>
    [...(data.value.trips ?? [])].sort((left, right) => left.start_date - right.start_date),
  )
  const activeTripId = computed(() => {
    const tripId = data.value.settings.find((setting) => setting.name === 'active_trip_id')?.parameter

    if (!tripId) {
      return ''
    }

    return trips.value.some((trip) => trip.trip_id === tripId) ? tripId : ''
  })
  const activeTrip = computed(() =>
    trips.value.find((trip) => trip.trip_id === activeTripId.value),
  )
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
    activeTrip.value ? getTripRemainingBudget(activeTrip.value.budget_amount, tripTransactions.value) : 0,
  )
  const tripDailyBreakdown = computed(() =>
    activeTrip.value ? getTripDailyBreakdown(activeTrip.value, tripTransactions.value) : [],
  )

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const loaded = await loadAppData()

      data.value = await normalizeActiveTripSetting(loaded)
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
    cycleIncomes,
    cycleExpenseTotal,
    cycleIncomeTotal,
    remainingBudget,
    daysUntilNextIncome,
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
    saveCycle: (draft: CycleDraft, cycleId?: string) => withRefresh(() => saveCycle(draft, cycleId)),
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
    restorePayload: (payload: AppDataPayload) => withRefresh(() => replaceAllData(payload)),
  }
}

export function getCycleById(cycles: BudgetCycle[], cycleId: string): BudgetCycle | undefined {
  return cycles.find((cycle) => cycle.cycle_id === cycleId)
}
