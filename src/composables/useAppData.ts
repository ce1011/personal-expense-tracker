import { computed, readonly, shallowRef } from 'vue'

import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import { getDaysUntilNextIncomeDay } from '@/lib/date'
import {
  createExpense,
  createIncome,
  createSaving,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  loadAppData,
  replaceAllData,
  saveCycle,
  saveExpenseCategory,
  saveIncomeCategory,
  saveTargetLimit,
  softDeleteExpenseCategory,
  softDeleteIncomeCategory,
  updateExpense,
  updateIncome,
  updateSaving,
} from '@/services/appDataService'
import type {
  AppDataPayload,
  BudgetCycle,
  CategoryDraft,
  CombinedTransaction,
  CycleDraft,
  ExpenseDraft,
  IncomeDraft,
  SavingDraft,
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
  const combinedTransactions = computed<CombinedTransaction[]>(() =>
    [
      ...data.value.expenses.map((expense) => ({
        id: expense.transaction_id,
        kind: 'expense' as const,
        category_id: expense.category_id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
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
        original_currency: saving.original_currency,
        original_amount: saving.original_amount,
        exchange_rate_hkd: saving.exchange_rate_hkd,
      })),
    ].sort((a, b) => b.date - a.date),
  )
  const recentTransactions = computed(() => combinedTransactions.value.slice(0, 8))

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      data.value = await loadAppData()
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
    combinedTransactions,
    recentTransactions,
    refresh,
    addExpense: (draft: ExpenseDraft) => withRefresh(() => createExpense(draft)),
    addIncome: (draft: IncomeDraft) => withRefresh(() => createIncome(draft)),
    addSaving: (draft: SavingDraft) => withRefresh(() => createSaving(draft)),
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
