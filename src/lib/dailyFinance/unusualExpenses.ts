import { startOfLocalDay } from '@/lib/date'
import type { CombinedTransaction } from '@/types/app-data'

export interface UnusualExpenseAlert {
  transactionId: string
  merchantName: string
  categoryId: string
  amount: number
  baselineAmount: number
  multiplier: number
  message: string
}

export interface UnusualExpenseAlertsInput {
  now?: number | Date
  lookbackDays?: number
  recentDays?: number
  minHistoryCount?: number
  multiplierThreshold?: number
}

const DAY_IN_MS = 86_400_000

export function getUnusualExpenseAlerts(
  transactions: CombinedTransaction[],
  input: UnusualExpenseAlertsInput = {},
): UnusualExpenseAlert[] {
  const nowTimestamp = input.now instanceof Date ? input.now.getTime() : (input.now ?? Date.now())
  const lookbackDays = input.lookbackDays ?? 30
  const recentDays = input.recentDays ?? 7
  const minHistoryCount = input.minHistoryCount ?? 3
  const multiplierThreshold = input.multiplierThreshold ?? 1.5
  const today = startOfLocalDay(new Date(nowTimestamp))
  const lookbackStart = today - lookbackDays * DAY_IN_MS
  const recentStart = today - recentDays * DAY_IN_MS
  const expenses = transactions
    .filter((transaction) => transaction.kind === 'expense')
    .filter((transaction) => transaction.date >= lookbackStart && transaction.date <= nowTimestamp)
    .sort((left, right) => left.date - right.date)

  const alerts: UnusualExpenseAlert[] = []

  for (const expense of expenses) {
    if (expense.date < recentStart) {
      continue
    }

    const history = expenses.filter(
      (transaction) =>
        transaction.id !== expense.id &&
        transaction.date < expense.date &&
        transaction.name === expense.name &&
        transaction.category_id === expense.category_id,
    )

    if (history.length < minHistoryCount) {
      continue
    }

    const baselineAmount = roundToTwo(
      history.reduce((sum, transaction) => sum + transaction.amount, 0) / history.length,
    )
    const multiplier = roundToTwo(expense.amount / baselineAmount)

    if (multiplier < multiplierThreshold) {
      continue
    }

    alerts.push({
      transactionId: expense.id,
      merchantName: expense.name,
      categoryId: expense.category_id,
      amount: expense.amount,
      baselineAmount,
      multiplier,
      message: `你最近 ${lookbackDays} 日 ${expense.name} 平均約 $${baselineAmount}，今次 $${Math.round(expense.amount)}。`,
    })
  }

  return alerts.sort((left, right) => right.multiplier - left.multiplier)
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2))
}
