import { describe, expect, test } from 'vitest'

import type { CombinedTransaction } from '@/types/app-data'
import { getUnusualExpenseAlerts } from './unusualExpenses'

describe('getUnusualExpenseAlerts', () => {
  test('flags a recent expense that is much higher than recent category and merchant history', () => {
    const now = new Date(2026, 6, 31).getTime()
    const transactions: CombinedTransaction[] = [
      makeExpense('Central Cafe', 'food', 40, new Date(2026, 6, 1).getTime()),
      makeExpense('Central Cafe', 'food', 44, new Date(2026, 6, 8).getTime()),
      makeExpense('Central Cafe', 'food', 42, new Date(2026, 6, 14).getTime()),
      makeExpense('Central Cafe', 'food', 68, new Date(2026, 6, 30).getTime()),
      makeExpense('Lunch Box', 'food', 55, new Date(2026, 6, 20).getTime()),
    ]

    const alerts = getUnusualExpenseAlerts(transactions, {
      now,
      lookbackDays: 30,
      recentDays: 7,
      minHistoryCount: 3,
      multiplierThreshold: 1.5,
    })

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      transactionId: 'Central Cafe-68-1785340800000',
      merchantName: 'Central Cafe',
      categoryId: 'food',
      amount: 68,
      baselineAmount: 42,
      multiplier: 1.62,
      message: '你最近 30 日 Central Cafe 平均約 $42，今次 $68。',
    })
  })

  test('does not flag transactions without enough history or below threshold', () => {
    const now = new Date(2026, 6, 31).getTime()
    const transactions: CombinedTransaction[] = [
      makeExpense('Book Store', 'shopping', 100, new Date(2026, 6, 2).getTime()),
      makeExpense('Book Store', 'shopping', 108, new Date(2026, 6, 20).getTime()),
      makeExpense('Book Store', 'shopping', 110, new Date(2026, 6, 29).getTime()),
    ]

    const alerts = getUnusualExpenseAlerts(transactions, {
      now,
      lookbackDays: 30,
      recentDays: 7,
      minHistoryCount: 3,
      multiplierThreshold: 1.5,
    })

    expect(alerts).toEqual([])
  })
})

function makeExpense(
  name: string,
  category_id: string,
  amount: number,
  date: number,
): CombinedTransaction {
  return {
    id: `${name}-${amount}-${date}`,
    kind: 'expense',
    category_id,
    name,
    amount,
    date,
  }
}
