import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

export interface WeeklyReview {
  weekStart: number
  weekEnd: number
  totalSpent: number
  totalIncome: number
  totalSavings: number
  transactionCount: number
  topCategory: { category_id: string; name: string; amount: number } | null
  vsPreviousWeek: {
    spentDelta: number
    spentDeltaPercent: number
  } | null
}

const DAY_MS = 86_400_000

export function getWeeklyReview(
  transactions: CombinedTransaction[],
  categories: readonly ExpenseCategory[],
  now: number | Date = new Date(),
): WeeklyReview {
  const date = new Date(now)
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const day = date.getDay()
  const daysSinceLastSunday = day === 0 ? 7 : day
  const lastSunday = today - daysSinceLastSunday * DAY_MS
  const lastMonday = lastSunday - 6 * DAY_MS
  const previousSunday = lastMonday - DAY_MS
  const previousMonday = previousSunday - 6 * DAY_MS

  const lastWeekTransactions = transactions.filter(
    (transaction) => transaction.date >= lastMonday && transaction.date < lastSunday + DAY_MS,
  )
  const previousWeekTransactions = transactions.filter(
    (transaction) =>
      transaction.date >= previousMonday && transaction.date < previousSunday + DAY_MS,
  )

  const totalSpent = sumByKind(lastWeekTransactions, 'expense')
  const totalIncome = sumByKind(lastWeekTransactions, 'income')
  const totalSavings = sumByKind(lastWeekTransactions, 'saving')
  const transactionCount = lastWeekTransactions.length

  return {
    weekStart: lastMonday,
    weekEnd: lastSunday,
    totalSpent,
    totalIncome,
    totalSavings,
    transactionCount,
    topCategory: findTopCategory(lastWeekTransactions, categories),
    vsPreviousWeek: compareSpending(totalSpent, previousWeekTransactions),
  }
}

function sumByKind(transactions: CombinedTransaction[], kind: CombinedTransaction['kind']): number {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

function findTopCategory(
  transactions: CombinedTransaction[],
  categories: readonly ExpenseCategory[],
): { category_id: string; name: string; amount: number } | null {
  const expenses = transactions.filter((transaction) => transaction.kind === 'expense')

  if (expenses.length === 0) {
    return null
  }

  const totals = new Map<string, number>()

  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }

  const [topCategoryId, topAmount] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? [
    undefined,
    0,
  ]

  if (!topCategoryId) {
    return null
  }

  const category = categories.find((entry) => entry.category_id === topCategoryId)

  return {
    category_id: topCategoryId,
    name: category?.name_tc || category?.name_en || topCategoryId,
    amount: topAmount,
  }
}

function compareSpending(
  lastWeekSpent: number,
  previousWeekTransactions: CombinedTransaction[],
): { spentDelta: number; spentDeltaPercent: number } | null {
  if (previousWeekTransactions.length === 0) {
    return null
  }

  const previousWeekSpent = sumByKind(previousWeekTransactions, 'expense')
  const spentDelta = lastWeekSpent - previousWeekSpent
  const spentDeltaPercent = previousWeekSpent > 0 ? (spentDelta / previousWeekSpent) * 100 : 0

  return { spentDelta, spentDeltaPercent }
}
