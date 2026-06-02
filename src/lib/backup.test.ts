import { describe, expect, test } from 'vitest'

import type { AppDataPayload } from '@/types/app-data'
import { validateAppDataPayload } from './backup'

const validPayload: AppDataPayload = {
  cycles: [
    {
      cycle_id: 'cycle-202605',
      cycle_code: '202605',
      income_day: 25,
      income: 50000,
      saving_target: 10000,
    },
  ],
  expenseCategories: [],
  incomeCategories: [],
  expenses: [],
  incomes: [],
  targetExpenses: [],
  savings: [
    {
      saving_id: 'saving-1',
      category_id: 'saving-cash',
      amount: 5000,
      date: 1780272000000,
      description: '緊急基金',
      create_date: 1780272000000,
      edit_date: 1780272000000,
      synced: false,
      original_currency: 'HKD',
      original_amount: 5000,
      exchange_rate_hkd: 1,
    },
  ],
  settings: [],
}

describe('validateAppDataPayload', () => {
  test('accepts a complete payload with required top-level arrays', () => {
    const result = validateAppDataPayload(validPayload)

    expect(result.ok).toBe(true)
  })

  test('rejects payloads missing a required top-level array', () => {
    const payload = { ...validPayload }
    Reflect.deleteProperty(payload, 'settings')

    const result = validateAppDataPayload(payload)

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('settings must be an array')
  })
})
