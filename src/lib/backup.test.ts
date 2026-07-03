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

  test('accepts payloads with trips', () => {
    const payload: AppDataPayload = {
      ...validPayload,
      trips: [
        {
          trip_id: 'trip-tokyo',
          name: 'Tokyo',
          destination: 'Tokyo, Japan',
          start_date: 1780272000000,
          end_date: 1780444799999,
          budget_amount: 12000,
          budget_currency: 'HKD',
          status: 'active',
          notes: 'Spring trip',
          created_at: 1779000000000,
          updated_at: 1779086400000,
        },
      ],
    }

    const result = validateAppDataPayload(payload)

    expect(result.ok).toBe(true)
  })

  test('accepts legacy payloads with no trips array', () => {
    const result = validateAppDataPayload(validPayload)

    expect(result.ok).toBe(true)
  })

  test('rejects trips with an invalid status', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      trips: [
        {
          trip_id: 'trip-1',
          name: 'Tokyo',
          destination: 'Tokyo, Japan',
          start_date: 1780272000000,
          end_date: 1780444799999,
          budget_amount: 12000,
          budget_currency: 'HKD',
          status: 'paused',
          notes: 'Spring trip',
          created_at: 1779000000000,
          updated_at: 1779086400000,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('trips[0].status must be one of planned, active, completed')
  })

  test('rejects trips with an invalid budget currency', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      trips: [
        {
          trip_id: 'trip-1',
          name: 'Tokyo',
          destination: 'Tokyo, Japan',
          start_date: 1780272000000,
          end_date: 1780444799999,
          budget_amount: 12000,
          budget_currency: 'EUR',
          status: 'active',
          notes: 'Spring trip',
          created_at: 1779000000000,
          updated_at: 1779086400000,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'trips[0].budget_currency must be one of HKD, USD, CNY, JPY, TWD, THB',
    )
  })

  test('rejects expenses with an invalid recurring_frequency', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      expenses: [
        {
          transaction_id: 'expense-1',
          category_id: 'food',
          name: 'Lunch',
          amount: 100,
          date: 1780272000000,
          create_date: 1780272000000,
          edit_date: 1780272000000,
          synced: false,
          recurring: true,
          recurring_frequency: 'daily',
          recurring_day: 1,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'expenses[0].recurring_frequency must be one of weekly, monthly, yearly',
    )
  })

  test('rejects incomes with a non-string original currency type', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      incomes: [
        {
          transaction_id: 'income-1',
          category_id: 'salary',
          name: 'Bonus',
          amount: 500,
          date: 1780272000000,
          create_date: 1780272000000,
          edit_date: 1780272000000,
          synced: false,
          original_currency: 123,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'incomes[0].original_currency must be one of HKD, USD, CNY, JPY, TWD, THB',
    )
  })

  test('rejects malformed fxRates when present but not an array', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      fxRates: null,
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('fxRates must be an array')
  })

  test('accepts payloads with savingChallenges', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      savingChallenges: [
        {
          challenge_id: 'challenge-1',
          name: 'Travel fund',
          target_amount: 5000,
          current_amount: 1200,
          status: 'active',
          created_at: 1779000000000,
          updated_at: 1779086400000,
        },
      ],
    })

    expect(result.ok).toBe(true)
  })

  test('accepts legacy payloads with no savingChallenges array', () => {
    const result = validateAppDataPayload(validPayload)

    expect(result.ok).toBe(true)
  })

  test('rejects savingChallenges with an invalid status', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      savingChallenges: [
        {
          challenge_id: 'challenge-1',
          name: 'Travel fund',
          target_amount: 5000,
          current_amount: 0,
          status: 'archived',
          created_at: 1779000000000,
          updated_at: 1779086400000,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'savingChallenges[0].status must be one of active, completed, paused',
    )
  })

  test('rejects savingChallenges when not an array', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      savingChallenges: 'not-an-array',
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('savingChallenges must be an array')
  })

  test('accepts savings with an optional challenge_id', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      savings: [
        {
          saving_id: 'saving-1',
          category_id: 'saving-cash',
          amount: 5000,
          date: 1780272000000,
          description: '緊急基金',
          challenge_id: 'challenge-1',
        },
      ],
    })

    expect(result.ok).toBe(true)
  })

  test('rejects savings with a non-string challenge_id', () => {
    const result = validateAppDataPayload({
      ...validPayload,
      savings: [
        {
          saving_id: 'saving-1',
          category_id: 'saving-cash',
          amount: 5000,
          date: 1780272000000,
          description: '緊急基金',
          challenge_id: 123,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('savings[0].challenge_id must be a string')
  })

  test('accepts legacy payloads with no optional fields', () => {
    const legacyPayload = {
      cycles: validPayload.cycles,
      expenseCategories: [],
      incomeCategories: [],
      expenses: [],
      incomes: [],
      targetExpenses: [],
      savings: [
        {
          saving_id: 'saving-1',
          amount: 1000,
          date: 1780272000000,
          description: 'Legacy saving',
        },
      ],
      settings: [],
    }

    const result = validateAppDataPayload(legacyPayload)

    expect(result.ok).toBe(true)
  })
})
