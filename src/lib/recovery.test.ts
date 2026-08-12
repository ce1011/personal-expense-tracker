import { describe, expect, test } from 'vitest'

import type { AppDataPayload, AppSnapshot } from '@/types/app-data'
import {
  createSnapshotRecord,
  summarizeRestoreImpact,
  summarizeSnapshots,
  trimSnapshots,
  validateSnapshotPayload,
} from './recovery'

const payload: AppDataPayload = {
  cycles: [
    {
      cycle_id: 'cycle-1',
      cycle_code: '202607',
      income_day: 25,
      income: 20000,
      saving_target: 4000,
    },
  ],
  expenseCategories: [
    {
      category_id: 'expense-food',
      name_en: 'Food',
      name_tc: '餐飲',
      color_code: 'b5392a',
      icon_image_name: 'utensils',
      custom: false,
      deleted: false,
    },
  ],
  incomeCategories: [
    {
      category_id: 'income-salary',
      name_en: 'Salary',
      name_tc: '薪金',
      color_code: '2f6f66',
      icon_image_name: 'wallet',
      custom: false,
      deleted: false,
    },
  ],
  expenses: [
    {
      transaction_id: 'expense-1',
      category_id: 'expense-food',
      name: 'Lunch',
      amount: 100,
      date: 1780272000000,
      create_date: 1780272000000,
      edit_date: 1780272000000,
      synced: false,
      trip_id: 'trip-1',
    },
  ],
  incomes: [
    {
      transaction_id: 'income-1',
      category_id: 'income-salary',
      name: 'Salary',
      amount: 20000,
      date: 1780272000000,
      create_date: 1780272000000,
      edit_date: 1780272000000,
      synced: false,
    },
  ],
  targetExpenses: [
    {
      target_expense_id: 'target-1',
      cycle_id: 'cycle-1',
      category_id: 'expense-food',
      amount: 3000,
    },
  ],
  savings: [
    {
      saving_id: 'saving-1',
      category_id: 'saving-stocks',
      amount: 500,
      date: 1780272000000,
      description: 'Emergency',
      trip_id: 'trip-1',
      challenge_id: 'challenge-1',
    },
  ],
  settings: [
    {
      setting_id: 'setting-active-trip-id',
      name: 'active_trip_id',
      parameter: 'trip-1',
    },
  ],
  trips: [
    {
      trip_id: 'trip-1',
      name: 'Tokyo',
      destination: 'Japan',
      start_date: 1780272000000,
      end_date: 1780444799999,
      budget_amount: 10000,
      budget_currency: 'HKD',
      status: 'active',
      notes: 'Trip',
      created_at: 1780200000000,
      updated_at: 1780200000000,
    },
  ],
  fxRates: [],
  savingChallenges: [
    {
      challenge_id: 'challenge-1',
      name: 'Travel fund',
      target_amount: 5000,
      current_amount: 500,
      status: 'active',
      created_at: 1780200000000,
      updated_at: 1780200000000,
    },
  ],
}

describe('recovery helpers', () => {
  test('creates a snapshot record with serialized payload and reason', () => {
    const snapshot = createSnapshotRecord(payload, 'expense:create', 1780300000000)

    expect(snapshot).toEqual({
      snapshot_id: 'snapshot-1780300000000',
      created_at: 1780300000000,
      reason: 'expense:create',
      payload_json: JSON.stringify(payload),
    })
  })

  test('sorts and trims snapshots newest first', () => {
    const snapshots: AppSnapshot[] = [
      { snapshot_id: 'snapshot-1', created_at: 100, reason: 'a', payload_json: '{}' },
      { snapshot_id: 'snapshot-2', created_at: 300, reason: 'b', payload_json: '{}' },
      { snapshot_id: 'snapshot-3', created_at: 200, reason: 'c', payload_json: '{}' },
    ]

    expect(summarizeSnapshots(snapshots).map((snapshot) => snapshot.snapshotId)).toEqual([
      'snapshot-2',
      'snapshot-3',
      'snapshot-1',
    ])
    expect(trimSnapshots(snapshots, 2).remove.map((snapshot) => snapshot.snapshot_id)).toEqual([
      'snapshot-1',
    ])
  })

  test('summarizes restore impact counts', () => {
    expect(summarizeRestoreImpact(payload)).toEqual({
      cycles: 1,
      expenseCategories: 1,
      incomeCategories: 1,
      expenses: 1,
      incomes: 1,
      targetExpenses: 1,
      savings: 1,
      settings: 1,
      trips: 1,
      fxRates: 0,
      savingChallenges: 1,
      assetAccounts: 0,
      accountBalances: 0,
    })
  })

  test('passes integrity validation for consistent payloads including built-in saving categories', () => {
    expect(validateSnapshotPayload(payload)).toEqual({ ok: true, errors: [] })
  })

  test('rejects payloads with broken category, trip, challenge, and setting references', () => {
    const invalid: AppDataPayload = {
      ...payload,
      expenses: [
        {
          ...payload.expenses[0]!,
          category_id: 'missing-category',
          trip_id: 'missing-trip',
        },
      ],
      savings: [
        {
          ...payload.savings[0]!,
          challenge_id: 'missing-challenge',
        },
      ],
      settings: [
        {
          setting_id: 'setting-active-trip-id',
          name: 'active_trip_id',
          parameter: 'missing-trip',
        },
      ],
    }

    const result = validateSnapshotPayload(invalid)

    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'Expense expense-1 references unknown category missing-category',
    )
    expect(result.errors).toContain('Expense expense-1 references unknown trip missing-trip')
    expect(result.errors).toContain(
      'Saving saving-1 references unknown challenge missing-challenge',
    )
    expect(result.errors).toContain('Setting active_trip_id references unknown trip missing-trip')
  })
})
