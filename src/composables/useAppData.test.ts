import { describe, expect, test } from 'vitest'

import type { AppDataPayload } from '@/types/app-data'
import { buildCombinedTransactions } from './useAppData'

const emptyPayload: AppDataPayload = {
  cycles: [],
  expenseCategories: [],
  incomeCategories: [],
  expenses: [],
  incomes: [],
  targetExpenses: [],
  savings: [],
  settings: [],
}

describe('buildCombinedTransactions', () => {
  test('maps recurring fields from expense transactions', () => {
    const payload: AppDataPayload = {
      ...emptyPayload,
      expenses: [
        {
          transaction_id: 'expense-1',
          category_id: 'food',
          name: 'Rent',
          amount: 5000,
          date: new Date('2026-07-01').getTime(),
          create_date: Date.now(),
          edit_date: Date.now(),
          synced: false,
          recurring: true,
          recurring_frequency: 'monthly',
          recurring_day: 1,
        },
      ],
    }

    const result = buildCombinedTransactions(payload)

    expect(result).toHaveLength(1)
    expect(result[0]?.recurring).toBe(true)
    expect(result[0]?.recurring_frequency).toBe('monthly')
    expect(result[0]?.recurring_day).toBe(1)
  })

  test('does not add recurring fields to income or saving transactions', () => {
    const payload: AppDataPayload = {
      ...emptyPayload,
      incomes: [
        {
          transaction_id: 'income-1',
          category_id: 'salary',
          name: 'Salary',
          amount: 10000,
          date: new Date('2026-07-01').getTime(),
          create_date: Date.now(),
          edit_date: Date.now(),
          synced: false,
        },
      ],
      savings: [
        {
          saving_id: 'saving-1',
          category_id: 'saving-cash',
          amount: 1000,
          date: new Date('2026-07-01').getTime(),
          description: 'Emergency fund',
          create_date: Date.now(),
          edit_date: Date.now(),
          synced: false,
        },
      ],
    }

    const result = buildCombinedTransactions(payload)

    expect(result).toHaveLength(2)
    expect(result.every((transaction) => transaction.recurring === undefined)).toBe(true)
    expect(result.every((transaction) => transaction.recurring_frequency === undefined)).toBe(true)
    expect(result.every((transaction) => transaction.recurring_day === undefined)).toBe(true)
  })
})
