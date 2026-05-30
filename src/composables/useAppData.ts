import { computed, readonly, shallowRef } from 'vue'

import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import {
  createExpense,
  createIncome,
  loadAppData,
  replaceAllData,
  saveCycle,
  saveExpenseCategory,
  saveIncomeCategory,
  saveTargetLimit,
  softDeleteExpenseCategory,
  softDeleteIncomeCategory,
} from '@/services/appDataService'
import type {
  AppDataPayload,
  BudgetCycle,
  CategoryDraft,
  CombinedTransaction,
  CycleDraft,
  ExpenseDraft,
  IncomeDraft,
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
    cycleExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  )
  const cycleIncomeTotal = computed(() =>
    cycleIncomes.value.reduce((sum, income) => sum + income.amount, currentCycle.value?.income ?? 0),
  )
  const savingProgress = computed(() => {
    const target = currentCycle.value?.saving_target ?? 0
    const remaining = cycleIncomeTotal.value - cycleExpenseTotal.value
    return target > 0 ? Math.max(0, Math.min(1, remaining / target)) : 0
  })
  const remainingBudget = computed(() => cycleIncomeTotal.value - cycleExpenseTotal.value)
  const combinedTransactions = computed<CombinedTransaction[]>(() =>
    [
      ...data.value.expenses.map((expense) => ({
        id: expense.transaction_id,
        kind: 'expense' as const,
        category_id: expense.category_id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
      })),
      ...data.value.incomes.map((income) => ({
        id: income.transaction_id,
        kind: 'income' as const,
        category_id: income.category_id,
        name: income.name,
        amount: income.amount,
        date: income.date,
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
    cycleExpenses,
    cycleIncomes,
    cycleExpenseTotal,
    cycleIncomeTotal,
    savingProgress,
    remainingBudget,
    combinedTransactions,
    recentTransactions,
    refresh,
    addExpense: (draft: ExpenseDraft) => withRefresh(() => createExpense(draft)),
    addIncome: (draft: IncomeDraft) => withRefresh(() => createIncome(draft)),
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
