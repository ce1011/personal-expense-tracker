import { describe, expect, test } from 'vitest'

import type { CombinedTransaction } from '@/types/app-data'
import { getSpendingStreak } from './spendingStreak'

describe('getSpendingStreak', () => {
  test('calculates current and longest no-spend plus low-spend streaks', () => {
    const now = new Date(2026, 6, 10).getTime()
    const transactions: CombinedTransaction[] = [
      makeExpense(120, new Date(2026, 6, 3).getTime()),
      makeExpense(45, new Date(2026, 6, 4).getTime()),
      makeExpense(15, new Date(2026, 6, 6).getTime()),
      makeExpense(18, new Date(2026, 6, 7).getTime()),
    ]

    const streak = getSpendingStreak(transactions, {
      now,
      lowSpendThreshold: 20,
      lookbackDays: 7,
    })

    expect(streak).toEqual({
      currentNoSpendDays: 3,
      longestNoSpendDays: 3,
      currentLowSpendDays: 6,
      longestLowSpendDays: 6,
      lowSpendThreshold: 20,
    })
  })

  test('counts days with only non-expense transactions as no-spend days', () => {
    const now = new Date(2026, 6, 10).getTime()
    const transactions: CombinedTransaction[] = [
      makeIncome(500, new Date(2026, 6, 9).getTime()),
      makeSaving(100, new Date(2026, 6, 8).getTime()),
      makeExpense(30, new Date(2026, 6, 6).getTime()),
    ]

    const streak = getSpendingStreak(transactions, {
      now,
      lowSpendThreshold: 20,
      lookbackDays: 4,
    })

    expect(streak.currentNoSpendDays).toBe(4)
    expect(streak.currentLowSpendDays).toBe(4)
  })
})

function makeExpense(amount: number, date: number): CombinedTransaction {
  return {
    id: `expense-${date}`,
    kind: 'expense',
    category_id: 'food',
    name: 'Expense',
    amount,
    date,
  }
}

function makeIncome(amount: number, date: number): CombinedTransaction {
  return {
    id: `income-${date}`,
    kind: 'income',
    category_id: 'salary',
    name: 'Income',
    amount,
    date,
  }
}

function makeSaving(amount: number, date: number): CombinedTransaction {
  return {
    id: `saving-${date}`,
    kind: 'saving',
    category_id: 'saving-cash',
    name: 'Saving',
    amount,
    date,
  }
}
