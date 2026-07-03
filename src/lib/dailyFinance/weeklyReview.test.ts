import { describe, expect, test } from 'vitest'

import { getWeeklyReview } from './weeklyReview'
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

describe('getWeeklyReview', () => {
  const categories: ExpenseCategory[] = [
    {
      category_id: 'food',
      name_en: 'Food',
      name_tc: '餐飲',
      color_code: 'b5392a',
      icon_image_name: 'utensils',
      custom: false,
      deleted: false,
    },
    {
      category_id: 'transport',
      name_en: 'Transport',
      name_tc: '交通',
      color_code: '2f6f66',
      icon_image_name: 'train',
      custom: false,
      deleted: false,
    },
  ]

  test('returns zeros and null comparison when there are no transactions', () => {
    const now = startOfMonday(2026, 7, 6) // Monday

    const review = getWeeklyReview([], categories, now)

    expect(review.totalSpent).toBe(0)
    expect(review.totalIncome).toBe(0)
    expect(review.totalSavings).toBe(0)
    expect(review.transactionCount).toBe(0)
    expect(review.topCategory).toBeNull()
    expect(review.vsPreviousWeek).toBeNull()
  })

  test('summarises the most recently completed week', () => {
    const lastMonday = startOfMonday(2026, 6, 29)
    const lastSunday = lastMonday + 6 * 86_400_000
    const previousMonday = lastMonday - 7 * 86_400_000
    const now = lastMonday + 7 * 86_400_000 + 1 // Monday after last week

    const transactions: CombinedTransaction[] = [
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 120, date: lastMonday }),
      makeTransaction({
        kind: 'expense',
        category_id: 'food',
        amount: 80,
        date: lastMonday + 86_400_000,
      }),
      makeTransaction({ kind: 'expense', category_id: 'transport', amount: 50, date: lastSunday }),
      makeTransaction({
        kind: 'income',
        category_id: 'salary',
        amount: 1000,
        date: lastMonday + 2 * 86_400_000,
      }),
      makeTransaction({
        kind: 'saving',
        category_id: 'saving-cash',
        amount: 200,
        date: lastSunday,
      }),
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 999, date: previousMonday }),
    ]

    const review = getWeeklyReview(transactions, categories, now)

    expect(review.weekStart).toBe(lastMonday)
    expect(review.weekEnd).toBe(lastSunday)
    expect(review.totalSpent).toBe(250)
    expect(review.totalIncome).toBe(1000)
    expect(review.totalSavings).toBe(200)
    expect(review.transactionCount).toBe(5)
    expect(review.topCategory).toEqual({ category_id: 'food', name: '餐飲', amount: 200 })
  })

  test('handles a week that spans two months', () => {
    const lastMonday = startOfMonday(2026, 6, 29) // 29 Jun 2026 is Monday
    const lastSunday = lastMonday + 6 * 86_400_000 // 5 Jul 2026
    const now = lastMonday + 7 * 86_400_000 + 1 // 6 Jul 2026

    const transactions: CombinedTransaction[] = [
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 100, date: lastMonday }),
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 100, date: lastSunday }),
    ]

    const review = getWeeklyReview(transactions, categories, now)

    expect(review.weekStart).toBe(lastMonday)
    expect(review.weekEnd).toBe(lastSunday)
    expect(review.totalSpent).toBe(200)
    expect(review.transactionCount).toBe(2)
  })

  test('returns null comparison when there is no previous week data', () => {
    const lastMonday = startOfMonday(2026, 6, 29)
    const lastSunday = lastMonday + 6 * 86_400_000
    const now = lastMonday + 7 * 86_400_000 + 1

    const transactions: CombinedTransaction[] = [
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 100, date: lastSunday }),
    ]

    const review = getWeeklyReview(transactions, categories, now)

    expect(review.vsPreviousWeek).toBeNull()
  })

  test('calculates week-over-week change against the previous week', () => {
    const lastMonday = startOfMonday(2026, 6, 29)
    const previousMonday = lastMonday - 7 * 86_400_000
    const now = lastMonday + 7 * 86_400_000 + 1

    const transactions: CombinedTransaction[] = [
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 100, date: lastMonday }),
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 200, date: previousMonday }),
    ]

    const review = getWeeklyReview(transactions, categories, now)

    expect(review.vsPreviousWeek).toEqual({
      spentDelta: -100,
      spentDeltaPercent: -50,
    })
  })
})

function startOfMonday(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function makeTransaction(
  partial: Pick<CombinedTransaction, 'kind' | 'category_id' | 'amount' | 'date'>,
): CombinedTransaction {
  return {
    id: 'txn-1',
    kind: partial.kind,
    category_id: partial.category_id,
    name: 'Test',
    amount: partial.amount,
    date: partial.date,
  }
}
