import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

export interface WeeklyReview {
  weekStart: number
  weekEnd: number
  totalSpent: number
  totalIncome: number
  totalSavings: number
  netCashflow: number
  transactionCount: number
  topCategory: { category_id: string; name: string; amount: number } | null
  largestExpense: { category_id: string; name: string; amount: number } | null
  vsPreviousWeek: {
    spentDelta: number
    spentDeltaPercent: number
  } | null
  brief: string[]
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
  const netCashflow = totalIncome - totalSpent - totalSavings
  const transactionCount = lastWeekTransactions.length
  const topCategory = findTopCategory(lastWeekTransactions, categories)
  const largestExpense = findLargestExpense(lastWeekTransactions)
  const vsPreviousWeek = compareSpending(totalSpent, previousWeekTransactions)

  return {
    weekStart: lastMonday,
    weekEnd: lastSunday,
    totalSpent,
    totalIncome,
    totalSavings,
    netCashflow,
    transactionCount,
    topCategory,
    largestExpense,
    vsPreviousWeek,
    brief: buildBrief({
      netCashflow,
      topCategory,
      largestExpense,
      transactionCount,
      vsPreviousWeek,
    }),
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

function findLargestExpense(
  transactions: CombinedTransaction[],
): { category_id: string; name: string; amount: number } | null {
  const largestExpense = transactions
    .filter((transaction) => transaction.kind === 'expense')
    .sort((left, right) => right.amount - left.amount)[0]

  if (!largestExpense) {
    return null
  }

  return {
    category_id: largestExpense.category_id,
    name: largestExpense.name,
    amount: largestExpense.amount,
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

function buildBrief(input: {
  netCashflow: number
  topCategory: { category_id: string; name: string; amount: number } | null
  largestExpense: { category_id: string; name: string; amount: number } | null
  transactionCount: number
  vsPreviousWeek: { spentDelta: number; spentDeltaPercent: number } | null
}): string[] {
  if (input.transactionCount === 0) {
    return []
  }

  const brief = [`本週淨現金流為 ${formatSignedAmount(input.netCashflow)}。`]

  if (input.topCategory) {
    brief.push(`最大支出來自${input.topCategory.name}，共 ${formatAmount(input.topCategory.amount)}。`)
  }

  if (input.largestExpense) {
    brief.push(
      `最大單筆支出是 ${input.largestExpense.name}，金額 ${formatAmount(input.largestExpense.amount)}。`,
    )
  }

  if (input.vsPreviousWeek) {
    const direction = input.vsPreviousWeek.spentDelta <= 0 ? '少使了' : '多使了'
    brief.push(
      `比上週${direction} ${formatAmount(Math.abs(input.vsPreviousWeek.spentDelta))}。`,
    )
  }

  brief.push(`本週共記錄 ${input.transactionCount} 筆交易。`)

  return brief.slice(0, 5)
}

function formatAmount(amount: number): string {
  return `$${Math.round(amount)}`
}

function formatSignedAmount(amount: number): string {
  if (amount > 0) {
    return `+$${Math.round(amount)}`
  }

  if (amount < 0) {
    return `-$${Math.round(Math.abs(amount))}`
  }

  return '$0'
}
