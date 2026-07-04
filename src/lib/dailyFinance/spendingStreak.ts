import { startOfLocalDay } from '@/lib/date'
import type { CombinedTransaction } from '@/types/app-data'

export interface SpendingStreak {
  currentNoSpendDays: number
  longestNoSpendDays: number
  currentLowSpendDays: number
  longestLowSpendDays: number
  lowSpendThreshold: number
}

export interface SpendingStreakInput {
  now?: number | Date
  lowSpendThreshold: number
  lookbackDays?: number
}

const DAY_IN_MS = 86_400_000

export function getSpendingStreak(
  transactions: CombinedTransaction[],
  input: SpendingStreakInput,
): SpendingStreak {
  const nowTimestamp = input.now instanceof Date ? input.now.getTime() : (input.now ?? Date.now())
  const lookbackDays = Math.max(input.lookbackDays ?? 14, 1)
  const today = startOfLocalDay(new Date(nowTimestamp))
  const dailyExpenseTotals = new Map<number, number>()

  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') {
      continue
    }

    const day = startOfLocalDay(new Date(transaction.date))
    dailyExpenseTotals.set(day, (dailyExpenseTotals.get(day) ?? 0) + transaction.amount)
  }

  const dayTotals = Array.from({ length: lookbackDays }, (_, index) => {
    const day = today - (lookbackDays - 1 - index) * DAY_IN_MS
    return dailyExpenseTotals.get(day) ?? 0
  })

  return {
    currentNoSpendDays: countTrailingDays(dayTotals, (total) => total === 0),
    longestNoSpendDays: countLongestDays(dayTotals, (total) => total === 0),
    currentLowSpendDays: countTrailingDays(dayTotals, (total) => total <= input.lowSpendThreshold),
    longestLowSpendDays: countLongestDays(dayTotals, (total) => total <= input.lowSpendThreshold),
    lowSpendThreshold: input.lowSpendThreshold,
  }
}

function countTrailingDays(values: number[], predicate: (value: number) => boolean): number {
  let count = 0

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (!predicate(values[index] ?? 0)) {
      break
    }

    count += 1
  }

  return count
}

function countLongestDays(values: number[], predicate: (value: number) => boolean): number {
  let longest = 0
  let current = 0

  for (const value of values) {
    if (predicate(value)) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }

    current = 0
  }

  return longest
}
