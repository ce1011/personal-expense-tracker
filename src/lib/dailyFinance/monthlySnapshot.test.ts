import { describe, expect, test } from 'vitest'

import { getMonthlySnapshot } from './monthlySnapshot'
import type { BudgetCycle, CombinedTransaction, ExpenseCategory } from '@/types/app-data'

describe('getMonthlySnapshot', () => {
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

  test('returns zeroed snapshot when there is no current cycle', () => {
    const result = getMonthlySnapshot([], [], [], [], categories, Date.now())

    expect(result.incomeTotal).toBe(0)
    expect(result.expenseTotal).toBe(0)
    expect(result.savingTotal).toBe(0)
    expect(result.savingsRate).toBe(0)
    expect(result.topExpenseCategories).toEqual([])
    expect(result.remainingBudget).toBe(0)
    expect(result.dailyAverageSpent).toBe(0)
    expect(result.vsLastCycle).toBeNull()
  })

  test('summarises the current cycle', () => {
    const now = new Date(2026, 6, 15).getTime() // 15 Jul 2026
    const currentCycle: BudgetCycle = {
      cycle_id: 'cycle-202607',
      cycle_code: '202607',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }
    const windowStart = new Date(2026, 5, 25).getTime() // 25 Jun
    const windowEnd = new Date(2026, 6, 25).getTime() // 25 Jul

    const incomes: CombinedTransaction[] = []
    const expenses: CombinedTransaction[] = [
      makeTransaction({
        kind: 'expense',
        category_id: 'food',
        amount: 3000,
        date: windowStart + 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'food',
        amount: 2000,
        date: windowStart + 2 * 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'transport',
        amount: 1000,
        date: windowStart + 3 * 86_400_000,
      }),
    ]
    const savings: CombinedTransaction[] = [
      makeTransaction({
        kind: 'saving',
        category_id: 'saving-cash',
        amount: 5000,
        date: windowStart + 4 * 86_400_000,
      }),
    ]

    const result = getMonthlySnapshot([currentCycle], expenses, incomes, savings, categories, now)

    expect(result.cycleWindow.start).toBe(windowStart)
    expect(result.cycleWindow.end).toBe(windowEnd)
    expect(result.incomeTotal).toBe(50000)
    expect(result.expenseTotal).toBe(6000)
    expect(result.savingTotal).toBe(5000)
    expect(result.savingsRate).toBe(0.1)
    expect(result.remainingBudget).toBe(39000)
    expect(result.topExpenseCategories).toEqual([
      { category_id: 'food', name: '餐飲', amount: 5000, percentage: expect.closeTo(83.33, 1) },
      {
        category_id: 'transport',
        name: '交通',
        amount: 1000,
        percentage: expect.closeTo(16.67, 1),
      },
    ])
  })

  test('compares totals against the previous cycle', () => {
    const now = new Date(2026, 6, 15).getTime()
    const currentCycle: BudgetCycle = {
      cycle_id: 'cycle-202607',
      cycle_code: '202607',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }
    const lastCycle: BudgetCycle = {
      cycle_id: 'cycle-202606',
      cycle_code: '202606',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }
    const currentStart = new Date(2026, 5, 25).getTime()
    const lastStart = new Date(2026, 4, 25).getTime()

    const expenses: CombinedTransaction[] = [
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 4000, date: currentStart }),
      makeTransaction({ kind: 'expense', category_id: 'food', amount: 2000, date: lastStart }),
    ]
    const savings: CombinedTransaction[] = [
      makeTransaction({
        kind: 'saving',
        category_id: 'saving-cash',
        amount: 6000,
        date: currentStart,
      }),
      makeTransaction({
        kind: 'saving',
        category_id: 'saving-cash',
        amount: 4000,
        date: lastStart,
      }),
    ]

    const result = getMonthlySnapshot(
      [currentCycle, lastCycle],
      expenses,
      [],
      savings,
      categories,
      now,
    )

    expect(result.vsLastCycle).toEqual({
      expenseDelta: 2000,
      expenseDeltaPercent: 100,
      savingDelta: 2000,
    })
  })

  test('returns null comparison when there is no previous cycle', () => {
    const now = new Date(2026, 6, 15).getTime()
    const currentCycle: BudgetCycle = {
      cycle_id: 'cycle-202607',
      cycle_code: '202607',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }

    const result = getMonthlySnapshot([currentCycle], [], [], [], categories, now)

    expect(result.vsLastCycle).toBeNull()
  })

  test('adds current-cycle income transactions on top of the cycle income', () => {
    const currentCycle: BudgetCycle = {
      cycle_id: 'cycle-202607',
      cycle_code: '202607',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }
    const windowStart = new Date(2026, 5, 25).getTime()
    const result = getMonthlySnapshot(
      [currentCycle],
      [],
      [makeTransaction({ kind: 'income', category_id: 'bonus', amount: 2000, date: windowStart })],
      [],
      categories,
      new Date(2026, 6, 15).getTime(),
    )

    expect(result.incomeTotal).toBe(52000)
  })

  test('handles zero expenses without division errors', () => {
    const now = new Date(2026, 6, 15).getTime()
    const currentCycle: BudgetCycle = {
      cycle_id: 'cycle-202607',
      cycle_code: '202607',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    }

    const result = getMonthlySnapshot([currentCycle], [], [], [], categories, now)

    expect(result.expenseTotal).toBe(0)
    expect(result.topExpenseCategories).toEqual([])
    expect(result.savingsRate).toBe(0)
  })
})

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
