import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import type { BudgetCycle, CombinedTransaction, ExpenseCategory } from '@/types/app-data'

export interface MonthlySnapshot {
  cycleWindow: { start: number; end: number; label: string }
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  savingsRate: number
  topExpenseCategories: { category_id: string; name: string; amount: number; percentage: number }[]
  remainingBudget: number
  dailyAverageSpent: number
  vsLastCycle: {
    expenseDelta: number
    expenseDeltaPercent: number
    savingDelta: number
  } | null
}

const DAY_MS = 86_400_000

export function getMonthlySnapshot(
  cycles: readonly BudgetCycle[],
  expenses: readonly CombinedTransaction[],
  incomes: readonly CombinedTransaction[],
  savings: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
  now: number | Date = new Date(),
): MonthlySnapshot {
  if (cycles.length === 0) {
    return emptySnapshot()
  }

  const currentCycle = cycles[0]

  if (!currentCycle) {
    return emptySnapshot()
  }

  const currentWindow = getCycleWindow(currentCycle.cycle_code, currentCycle.income_day)
  const currentExpenses = expenses.filter((transaction) =>
    isInCycleWindow(transaction.date, currentWindow),
  )
  const currentIncomes = incomes.filter((transaction) =>
    isInCycleWindow(transaction.date, currentWindow),
  )
  const currentSavings = savings.filter((transaction) =>
    isInCycleWindow(transaction.date, currentWindow),
  )

  const expenseTotal = sumAmounts(currentExpenses)
  const incomeTotal = currentCycle.income + sumAmounts(currentIncomes)
  const savingTotal = sumAmounts(currentSavings)
  const remainingBudget = incomeTotal - expenseTotal - savingTotal
  const daysElapsed = Math.max(
    1,
    Math.floor((Math.min(Number(now), currentWindow.end) - currentWindow.start) / DAY_MS) + 1,
  )

  return {
    cycleWindow: {
      start: currentWindow.start,
      end: currentWindow.end,
      label: currentWindow.label,
    },
    incomeTotal,
    expenseTotal,
    savingTotal,
    savingsRate: incomeTotal > 0 ? savingTotal / incomeTotal : 0,
    topExpenseCategories: buildTopCategories(currentExpenses, categories),
    remainingBudget,
    dailyAverageSpent: expenseTotal / daysElapsed,
    vsLastCycle: buildComparison(cycles, expenses, savings, currentExpenses, currentSavings),
  }
}

function emptySnapshot(): MonthlySnapshot {
  return {
    cycleWindow: { start: 0, end: 0, label: '' },
    incomeTotal: 0,
    expenseTotal: 0,
    savingTotal: 0,
    savingsRate: 0,
    topExpenseCategories: [],
    remainingBudget: 0,
    dailyAverageSpent: 0,
    vsLastCycle: null,
  }
}

function sumAmounts(transactions: readonly CombinedTransaction[]): number {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
}

function buildTopCategories(
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
): { category_id: string; name: string; amount: number; percentage: number }[] {
  if (expenses.length === 0) {
    return []
  }

  const totals = new Map<string, number>()

  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }

  const total = sumAmounts(expenses)

  return [...totals.entries()]
    .map(([category_id, amount]) => {
      const category = categories.find((entry) => entry.category_id === category_id)

      return {
        category_id,
        name: category?.name_tc || category?.name_en || category_id,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function buildComparison(
  cycles: readonly BudgetCycle[],
  expenses: readonly CombinedTransaction[],
  savings: readonly CombinedTransaction[],
  currentExpenses: readonly CombinedTransaction[],
  currentSavings: readonly CombinedTransaction[],
): { expenseDelta: number; expenseDeltaPercent: number; savingDelta: number } | null {
  const lastCycle = cycles[1]

  if (!lastCycle) {
    return null
  }

  const lastWindow = getCycleWindow(lastCycle.cycle_code, lastCycle.income_day)
  const lastExpenses = expenses.filter((transaction) =>
    isInCycleWindow(transaction.date, lastWindow),
  )
  const lastSavings = savings.filter((transaction) => isInCycleWindow(transaction.date, lastWindow))

  const currentExpenseTotal = sumAmounts(currentExpenses)
  const lastExpenseTotal = sumAmounts(lastExpenses)
  const expenseDelta = currentExpenseTotal - lastExpenseTotal
  const expenseDeltaPercent = lastExpenseTotal > 0 ? (expenseDelta / lastExpenseTotal) * 100 : 0

  return {
    expenseDelta,
    expenseDeltaPercent,
    savingDelta: sumAmounts(currentSavings) - sumAmounts(lastSavings),
  }
}
