import { describe, expect, test } from 'vitest'

import type { ExpenseTransaction } from '@/types/app-data'
import { getDetectedRecurringExpenses } from './recurringExpenseDetection'

describe('getDetectedRecurringExpenses', () => {
  test('detects monthly recurring merchants with similar amounts and predicts next due date', () => {
    const now = new Date(2026, 6, 20).getTime()
    const expenses: ExpenseTransaction[] = [
      makeExpense('Netflix', 98, new Date(2026, 3, 5).getTime()),
      makeExpense('Netflix', 102, new Date(2026, 4, 5).getTime()),
      makeExpense('Netflix', 100, new Date(2026, 5, 5).getTime()),
      makeExpense('Coffee', 40, new Date(2026, 6, 12).getTime()),
    ]

    const recurring = getDetectedRecurringExpenses(expenses, { now })

    expect(recurring).toEqual([
      {
        name: 'Netflix',
        averageAmount: 100,
        confidence: 1,
        frequency: 'monthly',
        recurringDay: 5,
        nextDueTimestamp: new Date(2026, 6, 5).getTime(),
        sampleCount: 3,
      },
    ])
  })

  test('ignores merchants without enough repeated cadence', () => {
    const now = new Date(2026, 6, 20).getTime()
    const expenses: ExpenseTransaction[] = [
      makeExpense('One-off Purchase', 500, new Date(2026, 3, 5).getTime()),
      makeExpense('One-off Purchase', 700, new Date(2026, 4, 18).getTime()),
      makeExpense('One-off Purchase', 650, new Date(2026, 5, 27).getTime()),
    ]

    expect(getDetectedRecurringExpenses(expenses, { now })).toEqual([])
  })
})

function makeExpense(name: string, amount: number, date: number): ExpenseTransaction {
  return {
    transaction_id: `${name}-${date}`,
    category_id: 'subscription',
    name,
    amount,
    date,
    create_date: date,
    edit_date: date,
    synced: false,
  }
}
