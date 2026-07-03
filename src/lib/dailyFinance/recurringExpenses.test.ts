import { describe, expect, test } from 'vitest'
import type { ExpenseTransaction } from '@/types/app-data'
import { getCycleFixedExpensesTotal, getRecurringExpenses, getUpcomingBills } from './recurringExpenses'

function expense(overrides: Partial<ExpenseTransaction> = {}): ExpenseTransaction {
  return {
    transaction_id: 'expense-1',
    category_id: 'expense-food',
    name: 'Rent',
    amount: 5000,
    date: new Date('2026-07-01').getTime(),
    create_date: Date.now(),
    edit_date: Date.now(),
    synced: false,
    ...overrides,
  }
}

describe('getRecurringExpenses', () => {
  test('returns only recurring expenses', () => {
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Rent', recurring: true, recurring_frequency: 'monthly', recurring_day: 1 }),
      expense({ name: 'Lunch', recurring: false }),
    ]

    const result = getRecurringExpenses(expenses)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Rent')
  })
})

describe('getCycleFixedExpensesTotal', () => {
  test('counts monthly recurring once per cycle', () => {
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Rent', recurring: true, recurring_frequency: 'monthly', recurring_day: 1, amount: 5000 }),
    ]

    const window = { start: new Date('2026-07-01').getTime(), end: new Date('2026-08-01').getTime(), label: '' }
    const result = getCycleFixedExpensesTotal(expenses, window)

    expect(result).toBe(5000)
  })
})

describe('getUpcomingBills', () => {
  test('lists monthly bill due within lookahead', () => {
    const now = new Date('2026-07-04').getTime()
    const expenses: ExpenseTransaction[] = [
      expense({ name: 'Netflix', recurring: true, recurring_frequency: 'monthly', recurring_day: 15, amount: 88 }),
    ]

    const result = getUpcomingBills(expenses, now, 14)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Netflix')
    expect(result[0]?.daysUntilDue).toBeGreaterThan(0)
  })
})
