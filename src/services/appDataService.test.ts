import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { AppDataPayload } from '@/types/app-data'

const {
  mockDataExport,
  mockDataImport,
  mockSnapshotsList,
  mockSnapshotsRestore,
  mockExpenseCreate,
  mockExpenseUpdate,
  mockExpenseRemove,
  mockIncomeCreate,
  mockIncomeUpdate,
  mockIncomeRemove,
  mockSavingCreate,
  mockSavingUpdate,
  mockSavingRemove,
  mockTransactionsImport,
  mockChallengeList,
  mockChallengeCreate,
  mockChallengeUpdate,
  mockChallengeRemove,
  mockTripsList,
  mockTripCreate,
  mockTripUpdate,
  mockSettingsList,
  mockSettingsSet,
  mockSettingsRemove,
  mockCyclesList,
  mockCycleCreate,
  mockCycleUpdate,
  mockTargetUpsert,
  mockExpenseCategoryList,
  mockExpenseCategoryCreate,
  mockExpenseCategoryUpdate,
  mockExpenseCategoryRemove,
  mockIncomeCategoryList,
  mockIncomeCategoryCreate,
  mockIncomeCategoryUpdate,
  mockIncomeCategoryRemove,
  mockFxRatesRefresh,
} = vi.hoisted(() => ({
  mockDataExport: vi.fn(),
  mockDataImport: vi.fn(),
  mockSnapshotsList: vi.fn(),
  mockSnapshotsRestore: vi.fn(),
  mockExpenseCreate: vi.fn(),
  mockExpenseUpdate: vi.fn(),
  mockExpenseRemove: vi.fn(),
  mockIncomeCreate: vi.fn(),
  mockIncomeUpdate: vi.fn(),
  mockIncomeRemove: vi.fn(),
  mockSavingCreate: vi.fn(),
  mockSavingUpdate: vi.fn(),
  mockSavingRemove: vi.fn(),
  mockTransactionsImport: vi.fn(),
  mockChallengeList: vi.fn(),
  mockChallengeCreate: vi.fn(),
  mockChallengeUpdate: vi.fn(),
  mockChallengeRemove: vi.fn(),
  mockTripsList: vi.fn(),
  mockTripCreate: vi.fn(),
  mockTripUpdate: vi.fn(),
  mockSettingsList: vi.fn(),
  mockSettingsSet: vi.fn(),
  mockSettingsRemove: vi.fn(),
  mockCyclesList: vi.fn(),
  mockCycleCreate: vi.fn(),
  mockCycleUpdate: vi.fn(),
  mockTargetUpsert: vi.fn(),
  mockExpenseCategoryList: vi.fn(),
  mockExpenseCategoryCreate: vi.fn(),
  mockExpenseCategoryUpdate: vi.fn(),
  mockExpenseCategoryRemove: vi.fn(),
  mockIncomeCategoryList: vi.fn(),
  mockIncomeCategoryCreate: vi.fn(),
  mockIncomeCategoryUpdate: vi.fn(),
  mockIncomeCategoryRemove: vi.fn(),
  mockFxRatesRefresh: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  api: {
    data: {
      export: mockDataExport,
      import: mockDataImport,
      snapshots: {
        list: mockSnapshotsList,
        restore: mockSnapshotsRestore,
      },
    },
    transactions: {
      expenses: {
        create: mockExpenseCreate,
        update: mockExpenseUpdate,
        remove: mockExpenseRemove,
      },
      incomes: {
        create: mockIncomeCreate,
        update: mockIncomeUpdate,
        remove: mockIncomeRemove,
      },
      savings: {
        create: mockSavingCreate,
        update: mockSavingUpdate,
        remove: mockSavingRemove,
      },
      import: mockTransactionsImport,
    },
    savingChallenges: {
      list: mockChallengeList,
      create: mockChallengeCreate,
      update: mockChallengeUpdate,
      remove: mockChallengeRemove,
    },
    trips: {
      list: mockTripsList,
      create: mockTripCreate,
      update: mockTripUpdate,
    },
    settings: {
      list: mockSettingsList,
      set: mockSettingsSet,
      remove: mockSettingsRemove,
    },
    cycles: {
      list: mockCyclesList,
      create: mockCycleCreate,
      update: mockCycleUpdate,
    },
    targetExpenses: {
      upsert: mockTargetUpsert,
    },
    categories: {
      expenses: {
        list: mockExpenseCategoryList,
        create: mockExpenseCategoryCreate,
        update: mockExpenseCategoryUpdate,
        remove: mockExpenseCategoryRemove,
      },
      incomes: {
        list: mockIncomeCategoryList,
        create: mockIncomeCategoryCreate,
        update: mockIncomeCategoryUpdate,
        remove: mockIncomeCategoryRemove,
      },
    },
    fxRates: {
      refresh: mockFxRatesRefresh,
    },
  },
  ApiError: class ApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly value: unknown,
    ) {
      super(`status ${status}`)
      this.name = 'ApiError'
    }
  },
}))

import {
  createExpense,
  createIncome,
  createSaving,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  exportBackup,
  getActiveTripId,
  getCurrency,
  getFxContext,
  getRecoverySnapshotSummaries,
  importTransactions,
  listExpenseCategories,
  listIncomeCategories,
  listSavingChallenges,
  listTrips,
  replaceAllDataWithSnapshot,
  restoreFromSnapshot,
  saveCycle,
  saveExpenseCategory,
  saveIncomeCategory,
  saveTargetLimit,
  saveTrip,
  setActiveTripId,
  softDeleteExpenseCategory,
  softDeleteIncomeCategory,
  updateExpense,
  updateIncome,
  updateSaving,
} from './appDataService'

const validPayload: AppDataPayload = {
  cycles: [
    {
      cycle_id: 'cycle-1',
      cycle_code: '2026-07',
      income_day: 1,
      income: 20000,
      saving_target: 5000,
    },
  ],
  expenseCategories: [
    {
      category_id: 'food',
      name_en: 'Food',
      name_tc: '飲食',
      color_code: 'ff0000',
      icon_image_name: 'food',
      custom: true,
      deleted: false,
    },
  ],
  incomeCategories: [],
  expenses: [
    {
      transaction_id: 'expense-1',
      category_id: 'food',
      name: 'Lunch',
      amount: 50,
      date: Date.now(),
      create_date: Date.now(),
      edit_date: Date.now(),
      synced: false,
    },
  ],
  incomes: [],
  targetExpenses: [],
  savings: [],
  settings: [],
  trips: [],
  fxRates: [],
  savingChallenges: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('context reads', () => {
  test('sorts expense and income categories by English name', async () => {
    mockExpenseCategoryList.mockResolvedValue([
      { category_id: 'b', name_en: 'Transport', name_tc: '', color_code: '', icon_image_name: '' },
      { category_id: 'a', name_en: 'Food', name_tc: '', color_code: '', icon_image_name: '' },
    ])
    mockIncomeCategoryList.mockResolvedValue([
      { category_id: 'x', name_en: 'Salary', name_tc: '', color_code: '', icon_image_name: '' },
      { category_id: 'y', name_en: 'Bonus', name_tc: '', color_code: '', icon_image_name: '' },
    ])

    await expect(listExpenseCategories()).resolves.toEqual([
      expect.objectContaining({ category_id: 'a' }),
      expect.objectContaining({ category_id: 'b' }),
    ])
    await expect(listIncomeCategories()).resolves.toEqual([
      expect.objectContaining({ category_id: 'y' }),
      expect.objectContaining({ category_id: 'x' }),
    ])
  })

  test('sorts trips by start date ascending', async () => {
    mockTripsList.mockResolvedValue([
      { trip_id: 'late', start_date: 200 },
      { trip_id: 'early', start_date: 100 },
    ])

    const trips = await listTrips()
    expect(trips.map((trip) => trip.trip_id)).toEqual(['early', 'late'])
  })

  test('sorts saving challenges by most recently updated', async () => {
    mockChallengeList.mockResolvedValue([
      { challenge_id: 'old', updated_at: 100 },
      { challenge_id: 'new', updated_at: 300 },
    ])

    const challenges = await listSavingChallenges()
    expect(challenges.map((challenge) => challenge.challenge_id)).toEqual(['new', 'old'])
  })

  test('reads the currency setting, defaulting to HKD', async () => {
    mockSettingsList.mockResolvedValue([{ setting_id: 's1', name: 'currency', parameter: 'JPY' }])
    await expect(getCurrency()).resolves.toBe('JPY')

    mockSettingsList.mockResolvedValue([])
    await expect(getCurrency()).resolves.toBe('HKD')
  })

  test('builds an FX rate map with HKD base and the latest source date', async () => {
    mockFxRatesRefresh.mockResolvedValue([
      { currency_code: 'JPY', rate_to_hkd: 0.05, source_date: '2026-07-01' },
      { currency_code: 'USD', rate_to_hkd: 7.8, source_date: '2026-07-03' },
    ])

    const fx = await getFxContext()
    expect(mockFxRatesRefresh).toHaveBeenCalledOnce()
    expect(fx.fxRateMap.get('HKD')).toBe(1)
    expect(fx.fxRateMap.get('JPY')).toBe(0.05)
    expect(fx.fxRateMap.get('USD')).toBe(7.8)
    expect(fx.latestFxDate).toBe('2026-07-03')
  })

  test('returns an empty latest FX date when no rates exist', async () => {
    mockFxRatesRefresh.mockResolvedValue([])

    const fx = await getFxContext()
    expect(fx.fxRateMap.get('HKD')).toBe(1)
    expect(fx.latestFxDate).toBe('')
  })
})

describe('exportBackup', () => {
  test('returns the full payload from the export endpoint', async () => {
    mockDataExport.mockResolvedValue(validPayload)
    await expect(exportBackup()).resolves.toEqual(validPayload)
    expect(mockDataExport).toHaveBeenCalled()
  })
})

describe('transactions', () => {
  test('maps an expense draft to the API body', async () => {
    await createExpense({
      category_id: 'food',
      name: '  Lunch  ',
      amount: 50,
      date: 123,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
      recurring: true,
      recurring_frequency: 'monthly',
      recurring_day: 5,
    })

    expect(mockExpenseCreate).toHaveBeenCalledWith({
      category_id: 'food',
      name: 'Lunch',
      amount: 50,
      date: 123,
      trip_id: undefined,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
      recurring: true,
      recurring_frequency: 'monthly',
      recurring_day: 5,
    })
  })

  test('maps a saving draft name to the API description field', async () => {
    await createSaving({
      category_id: 'saving-cash',
      name: 'Emergency fund',
      amount: 1000,
      date: 99,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
      challenge_id: 'challenge-1',
    })

    expect(mockSavingCreate).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Emergency fund', challenge_id: 'challenge-1' }),
    )
  })

  test('updates and deletes transactions by id', async () => {
    await updateExpense('expense-1', {
      category_id: 'food',
      name: 'Dinner',
      amount: 80,
      date: 5,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
    })
    await updateIncome('income-1', {
      category_id: 'salary',
      name: 'Salary',
      amount: 10000,
      date: 6,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
    })
    await updateSaving('saving-1', {
      category_id: 'saving-cash',
      name: 'Top up',
      amount: 500,
      date: 7,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
    })
    await deleteExpense('expense-1')
    await deleteIncome('income-1')
    await deleteSaving('saving-1')

    expect(mockExpenseUpdate).toHaveBeenCalledWith(
      'expense-1',
      expect.objectContaining({ name: 'Dinner' }),
    )
    expect(mockIncomeUpdate).toHaveBeenCalledWith(
      'income-1',
      expect.objectContaining({ name: 'Salary' }),
    )
    expect(mockSavingUpdate).toHaveBeenCalledWith(
      'saving-1',
      expect.objectContaining({ description: 'Top up' }),
    )
    expect(mockExpenseRemove).toHaveBeenCalledWith('expense-1')
    expect(mockIncomeRemove).toHaveBeenCalledWith('income-1')
    expect(mockSavingRemove).toHaveBeenCalledWith('saving-1')
  })

  test('creates an income draft via the API', async () => {
    await createIncome({
      category_id: 'salary',
      name: 'Salary',
      amount: 10000,
      date: 1,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
    })

    expect(mockIncomeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 'salary', amount: 10000 }),
    )
  })
})

describe('importTransactions', () => {
  test('sends all records to the import endpoint', async () => {
    await importTransactions([
      {
        type: 'expense',
        category_id: 'food',
        name: 'Lunch',
        amount: 50,
        date: 1,
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      },
      {
        type: 'saving',
        category_id: 'saving-cash',
        name: 'Save',
        amount: 100,
        date: 2,
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      },
    ])

    expect(mockTransactionsImport).toHaveBeenCalledWith({
      records: [
        expect.objectContaining({ type: 'expense', name: 'Lunch' }),
        expect.objectContaining({ type: 'saving', name: 'Save' }),
      ],
    })
  })
})

describe('cycles', () => {
  test('updates via PUT when an explicit cycleId is provided', async () => {
    await saveCycle(
      { cycle_code: '2026-07', income_day: 1, income: 20000, saving_target: 5000 },
      'cycle-9',
    )

    expect(mockCycleUpdate).toHaveBeenCalledWith(
      'cycle-9',
      expect.objectContaining({ cycle_code: '2026-07' }),
    )
    expect(mockCycleCreate).not.toHaveBeenCalled()
  })

  test('updates the existing cycle matched by cycle_code when no id is given', async () => {
    mockCyclesList.mockResolvedValue([
      { cycle_id: 'cycle-1', cycle_code: '2026-07', income_day: 1, income: 1, saving_target: 0 },
    ])

    await saveCycle({ cycle_code: '2026-07', income_day: 2, income: 30000, saving_target: 8000 })

    expect(mockCycleUpdate).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({ income: 30000 }),
    )
    expect(mockCycleCreate).not.toHaveBeenCalled()
  })

  test('creates a new cycle when cycle_code is not found', async () => {
    mockCyclesList.mockResolvedValue([])

    await saveCycle({ cycle_code: '2026-08', income_day: 1, income: 1000, saving_target: 100 })

    expect(mockCycleCreate).toHaveBeenCalledWith(expect.objectContaining({ cycle_code: '2026-08' }))
    expect(mockCycleUpdate).not.toHaveBeenCalled()
  })
})

describe('categories and targets', () => {
  test('creates and soft-deletes categories', async () => {
    const draft = {
      name_en: 'Coffee',
      name_tc: '咖啡',
      color_code: '#aabbcc',
      icon_image_name: 'coffee',
    }

    await saveExpenseCategory(draft)
    await saveIncomeCategory(draft)
    await saveExpenseCategory(draft, 'cat-1')
    await softDeleteExpenseCategory('cat-1')
    await softDeleteIncomeCategory('cat-2')

    expect(mockExpenseCategoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name_en: 'Coffee', color_code: 'aabbcc' }),
    )
    expect(mockIncomeCategoryCreate).toHaveBeenCalled()
    expect(mockExpenseCategoryUpdate).toHaveBeenCalledWith('cat-1', expect.anything())
    expect(mockExpenseCategoryRemove).toHaveBeenCalledWith('cat-1')
    expect(mockIncomeCategoryRemove).toHaveBeenCalledWith('cat-2')
  })

  test('upserts a target expense limit', async () => {
    await saveTargetLimit('cycle-1', 'food', 3000)

    expect(mockTargetUpsert).toHaveBeenCalledWith({
      cycle_id: 'cycle-1',
      category_id: 'food',
      amount: 3000,
    })
  })
})

describe('trips and active trip setting', () => {
  test('creates and updates trips', async () => {
    const draft = {
      name: 'Tokyo',
      destination: 'Japan',
      start_date: 1,
      end_date: 2,
      budget_amount: 10000,
      budget_currency: 'JPY' as const,
      status: 'planned' as const,
      notes: 'Trip',
    }

    await saveTrip(draft)
    await saveTrip(draft, { trip_id: 'trip-1', created_at: 5 })

    expect(mockTripCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tokyo' }))
    expect(mockTripUpdate).toHaveBeenCalledWith(
      'trip-1',
      expect.objectContaining({ name: 'Tokyo' }),
    )
  })

  test('reads and sets the active trip id setting', async () => {
    mockSettingsList.mockResolvedValue([
      { setting_id: 's1', name: 'active_trip_id', parameter: 'trip-1' },
    ])
    await expect(getActiveTripId()).resolves.toBe('trip-1')

    mockTripsList.mockResolvedValue([
      {
        trip_id: 'trip-1',
        name: 'Tokyo',
        destination: 'Japan',
        start_date: 1,
        end_date: 2,
        budget_amount: 1,
        budget_currency: 'JPY',
        status: 'active',
        notes: '',
        created_at: 1,
        updated_at: 1,
      },
    ])
    await setActiveTripId('trip-1')
    expect(mockSettingsSet).toHaveBeenCalledWith('active_trip_id', { parameter: 'trip-1' })

    await setActiveTripId()
    expect(mockSettingsRemove).toHaveBeenCalledWith('active_trip_id')
  })

  test('rejects an unknown trip id when setting the active trip', async () => {
    mockTripsList.mockResolvedValue([])

    await expect(setActiveTripId('missing-trip')).rejects.toThrow('Unknown trip_id')
    expect(mockSettingsSet).not.toHaveBeenCalled()
  })
})

describe('recovery', () => {
  test('returns snapshot summaries sorted newest first', async () => {
    mockSnapshotsList.mockResolvedValue([
      { snapshot_id: 's1', created_at: 100, reason: 'expense:create' },
      { snapshot_id: 's2', created_at: 300, reason: 'restore:before' },
    ])

    await expect(getRecoverySnapshotSummaries()).resolves.toEqual([
      { snapshotId: 's2', createdAt: 300, reason: 'restore:before' },
      { snapshotId: 's1', createdAt: 100, reason: 'expense:create' },
    ])
  })

  test('restores a snapshot by id', async () => {
    await restoreFromSnapshot('snapshot-1')
    expect(mockSnapshotsRestore).toHaveBeenCalledWith('snapshot-1')
  })

  test('replaces all data after validating the payload', async () => {
    await replaceAllDataWithSnapshot(validPayload)
    expect(mockDataImport).toHaveBeenCalledWith(validPayload)
  })

  test('rejects an invalid payload without calling the API', async () => {
    const invalid = {
      ...validPayload,
      expenses: [{ transaction_id: 'broken' } as never],
    }

    await expect(replaceAllDataWithSnapshot(invalid)).rejects.toThrow()
    expect(mockDataImport).not.toHaveBeenCalled()
  })
})
