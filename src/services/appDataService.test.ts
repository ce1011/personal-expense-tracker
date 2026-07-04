import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  mockDbTransaction,
  mockExpenseAdd,
  mockIncomeAdd,
  mockSavingAdd,
  mockExpenseUpdate,
  mockIncomeUpdate,
  mockSavingUpdate,
  mockExpenseDelete,
  mockIncomeDelete,
  mockSavingDelete,
  mockTripPut,
  mockTripGet,
  mockTripToArray,
  mockSettingPut,
  mockSettingFirst,
  mockSettingDelete,
  mockCyclesToArray,
  mockExpenseCategoriesToArray,
  mockIncomeCategoriesToArray,
  mockExpensesToArray,
  mockIncomesToArray,
  mockTargetExpensesToArray,
  mockSavingsToArray,
  mockSettingsToArray,
  mockFxRatesToArray,
  mockSavingChallengesToArray,
  mockSnapshotsAdd,
  mockSnapshotsToArray,
  mockSnapshotsBulkDelete,
  mockCyclesClear,
  mockExpenseCategoriesClear,
  mockIncomeCategoriesClear,
  mockExpensesClear,
  mockIncomesClear,
  mockTargetExpensesClear,
  mockSavingsClear,
  mockSettingsClear,
  mockTripsClear,
  mockFxRatesClear,
  mockSavingChallengesClear,
  mockCyclesBulkPut,
  mockExpenseCategoriesBulkPut,
  mockIncomeCategoriesBulkPut,
  mockExpensesBulkPut,
  mockIncomesBulkPut,
  mockTargetExpensesBulkPut,
  mockSavingsBulkPut,
  mockSettingsBulkPut,
  mockTripsBulkPut,
  mockFxRatesBulkPut,
  mockSavingChallengesBulkPut,
} = vi.hoisted(() => ({
  mockDbTransaction: vi.fn(
    async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback(),
  ),
  mockExpenseAdd: vi.fn(),
  mockIncomeAdd: vi.fn(),
  mockSavingAdd: vi.fn(),
  mockExpenseUpdate: vi.fn(),
  mockIncomeUpdate: vi.fn(),
  mockSavingUpdate: vi.fn(),
  mockExpenseDelete: vi.fn(),
  mockIncomeDelete: vi.fn(),
  mockSavingDelete: vi.fn(),
  mockTripPut: vi.fn(),
  mockTripGet: vi.fn(),
  mockTripToArray: vi.fn(),
  mockSettingPut: vi.fn(),
  mockSettingFirst: vi.fn(),
  mockSettingDelete: vi.fn(),
  mockCyclesToArray: vi.fn(),
  mockExpenseCategoriesToArray: vi.fn(),
  mockIncomeCategoriesToArray: vi.fn(),
  mockExpensesToArray: vi.fn(),
  mockIncomesToArray: vi.fn(),
  mockTargetExpensesToArray: vi.fn(),
  mockSavingsToArray: vi.fn(),
  mockSettingsToArray: vi.fn(),
  mockFxRatesToArray: vi.fn(),
  mockSavingChallengesToArray: vi.fn(),
  mockSnapshotsAdd: vi.fn(),
  mockSnapshotsToArray: vi.fn(),
  mockSnapshotsBulkDelete: vi.fn(),
  mockCyclesClear: vi.fn(),
  mockExpenseCategoriesClear: vi.fn(),
  mockIncomeCategoriesClear: vi.fn(),
  mockExpensesClear: vi.fn(),
  mockIncomesClear: vi.fn(),
  mockTargetExpensesClear: vi.fn(),
  mockSavingsClear: vi.fn(),
  mockSettingsClear: vi.fn(),
  mockTripsClear: vi.fn(),
  mockFxRatesClear: vi.fn(),
  mockSavingChallengesClear: vi.fn(),
  mockCyclesBulkPut: vi.fn(),
  mockExpenseCategoriesBulkPut: vi.fn(),
  mockIncomeCategoriesBulkPut: vi.fn(),
  mockExpensesBulkPut: vi.fn(),
  mockIncomesBulkPut: vi.fn(),
  mockTargetExpensesBulkPut: vi.fn(),
  mockSavingsBulkPut: vi.fn(),
  mockSettingsBulkPut: vi.fn(),
  mockTripsBulkPut: vi.fn(),
  mockFxRatesBulkPut: vi.fn(),
  mockSavingChallengesBulkPut: vi.fn(),
}))


vi.mock('@/db/database', () => ({
  db: {
    transaction: mockDbTransaction,
    cycles: { toArray: mockCyclesToArray, clear: mockCyclesClear, bulkPut: mockCyclesBulkPut },
    expenseCategories: {
      toArray: mockExpenseCategoriesToArray,
      clear: mockExpenseCategoriesClear,
      bulkPut: mockExpenseCategoriesBulkPut,
    },
    incomeCategories: {
      toArray: mockIncomeCategoriesToArray,
      clear: mockIncomeCategoriesClear,
      bulkPut: mockIncomeCategoriesBulkPut,
    },
    expenses: {
      add: mockExpenseAdd,
      update: mockExpenseUpdate,
      delete: mockExpenseDelete,
      toArray: mockExpensesToArray,
      clear: mockExpensesClear,
      bulkPut: mockExpensesBulkPut,
    },
    incomes: {
      add: mockIncomeAdd,
      update: mockIncomeUpdate,
      delete: mockIncomeDelete,
      toArray: mockIncomesToArray,
      clear: mockIncomesClear,
      bulkPut: mockIncomesBulkPut,
    },
    savings: {
      add: mockSavingAdd,
      update: mockSavingUpdate,
      delete: mockSavingDelete,
      toArray: mockSavingsToArray,
      clear: mockSavingsClear,
      bulkPut: mockSavingsBulkPut,
    },
    targetExpenses: {
      toArray: mockTargetExpensesToArray,
      clear: mockTargetExpensesClear,
      bulkPut: mockTargetExpensesBulkPut,
    },
    trips: {
      put: mockTripPut,
      get: mockTripGet,
      toArray: mockTripToArray,
      clear: mockTripsClear,
      bulkPut: mockTripsBulkPut,
    },
    settings: {
      put: mockSettingPut,
      delete: mockSettingDelete,
      toArray: mockSettingsToArray,
      clear: mockSettingsClear,
      bulkPut: mockSettingsBulkPut,
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: mockSettingFirst,
        })),
      })),
    },
    fxRates: {
      toArray: mockFxRatesToArray,
      clear: mockFxRatesClear,
      bulkPut: mockFxRatesBulkPut,
    },
    savingChallenges: {
      toArray: mockSavingChallengesToArray,
      clear: mockSavingChallengesClear,
      bulkPut: mockSavingChallengesBulkPut,
    },
    snapshots: {
      add: mockSnapshotsAdd,
      toArray: mockSnapshotsToArray,
      bulkDelete: mockSnapshotsBulkDelete,
    },
  },
  createInitialPayload: vi.fn(),
}))

import {
  createExpense,
  createIncome,
  createSaving,
  deleteExpense,
  deleteIncome,
  deleteSaving,
  getActiveTripId,
  getRecoverySnapshotSummaries,
  getRestorePreview,
  getTrips,
  importTransactions,
  restoreFromSnapshot,
  saveTrip,
  setActiveTripId,
  updateExpense,
  updateIncome,
  updateSaving,
} from './appDataService'

describe('appDataService transaction updates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-31T08:15:00.000Z'))
    mockDbTransaction.mockClear()
    mockExpenseAdd.mockReset()
    mockIncomeAdd.mockReset()
    mockSavingAdd.mockReset()
    mockExpenseUpdate.mockReset()
    mockIncomeUpdate.mockReset()
    mockSavingUpdate.mockReset()
    mockExpenseDelete.mockReset()
    mockIncomeDelete.mockReset()
    mockSavingDelete.mockReset()
    mockTripPut.mockReset()
    mockTripGet.mockReset()
    mockTripGet.mockImplementation(async (tripId?: string) =>
      tripId
        ? {
            trip_id: tripId,
            name: 'Known Trip',
            destination: 'Japan',
            start_date: 1780185600000,
            end_date: 1780444800000,
            budget_amount: 15000,
            budget_currency: 'JPY',
            status: 'active',
            notes: 'Known trip',
            created_at: 1780205700000,
            updated_at: 1780205700000,
          }
        : undefined,
    )
    mockCyclesToArray.mockReset()
    mockCyclesToArray.mockResolvedValue([])
    mockExpenseCategoriesToArray.mockReset()
    mockExpenseCategoriesToArray.mockResolvedValue([])
    mockIncomeCategoriesToArray.mockReset()
    mockIncomeCategoriesToArray.mockResolvedValue([])
    mockExpensesToArray.mockReset()
    mockExpensesToArray.mockResolvedValue([])
    mockIncomesToArray.mockReset()
    mockIncomesToArray.mockResolvedValue([])
    mockTargetExpensesToArray.mockReset()
    mockTargetExpensesToArray.mockResolvedValue([])
    mockSavingsToArray.mockReset()
    mockSavingsToArray.mockResolvedValue([])
    mockSettingsToArray.mockReset()
    mockSettingsToArray.mockResolvedValue([])
    mockFxRatesToArray.mockReset()
    mockFxRatesToArray.mockResolvedValue([])
    mockSavingChallengesToArray.mockReset()
    mockSavingChallengesToArray.mockResolvedValue([])
    mockSnapshotsAdd.mockReset()
    mockSnapshotsToArray.mockReset()
    mockSnapshotsToArray.mockResolvedValue([])
    mockSnapshotsBulkDelete.mockReset()
    mockCyclesClear.mockReset()
    mockExpenseCategoriesClear.mockReset()
    mockIncomeCategoriesClear.mockReset()
    mockExpensesClear.mockReset()
    mockIncomesClear.mockReset()
    mockTargetExpensesClear.mockReset()
    mockSavingsClear.mockReset()
    mockSettingsClear.mockReset()
    mockTripsClear.mockReset()
    mockFxRatesClear.mockReset()
    mockSavingChallengesClear.mockReset()
    mockCyclesBulkPut.mockReset()
    mockExpenseCategoriesBulkPut.mockReset()
    mockIncomeCategoriesBulkPut.mockReset()
    mockExpensesBulkPut.mockReset()
    mockIncomesBulkPut.mockReset()
    mockTargetExpensesBulkPut.mockReset()
    mockSavingsBulkPut.mockReset()
    mockSettingsBulkPut.mockReset()
    mockTripsBulkPut.mockReset()
    mockFxRatesBulkPut.mockReset()
    mockSavingChallengesBulkPut.mockReset()
  })

  test('creates trip-aware expense, income, and saving records', async () => {
    await createExpense({
      category_id: 'expense-food',
      name: ' Lunch ',
      amount: 12,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'USD',
      exchange_rate_hkd: 7.8,
    })
    await createIncome({
      category_id: 'income-salary',
      name: ' Bonus ',
      amount: 1000,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'CNY',
      exchange_rate_hkd: 1.08,
    })
    await createSaving({
      category_id: 'saving-stocks',
      name: ' VOO ',
      amount: 200,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'USD',
      exchange_rate_hkd: 7.8,
    })

    expect(mockExpenseAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 'expense-food',
        name: 'Lunch',
        amount: 93.6,
        trip_id: 'trip-tokyo',
        original_currency: 'USD',
        original_amount: 12,
      }),
    )
    expect(mockIncomeAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 'income-salary',
        name: 'Bonus',
        amount: 1080,
        trip_id: 'trip-tokyo',
        original_currency: 'CNY',
        original_amount: 1000,
      }),
    )
    expect(mockSavingAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 'saving-stocks',
        description: 'VOO',
        amount: 1560,
        trip_id: 'trip-tokyo',
        original_currency: 'USD',
        original_amount: 200,
      }),
    )
  })

  test('updates an expense in HKD while preserving original currency reference fields', async () => {
    await updateExpense('expense-1', {
      category_id: 'expense-food',
      name: '午餐',
      amount: 12,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'USD',
      exchange_rate_hkd: 7.8,
    })

    expect(mockExpenseUpdate).toHaveBeenCalledWith('expense-1', {
      category_id: 'expense-food',
      name: '午餐',
      amount: 93.6,
      date: 1780185600000,
      edit_date: Date.now(),
      synced: false,
      trip_id: 'trip-tokyo',
      original_currency: 'USD',
      original_amount: 12,
      exchange_rate_hkd: 7.8,
    })
  })

  test('updates an income in HKD while preserving original currency reference fields', async () => {
    await updateIncome('income-1', {
      category_id: 'income-salary',
      name: '薪金',
      amount: 1000,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'CNY',
      exchange_rate_hkd: 1.08,
    })

    expect(mockIncomeUpdate).toHaveBeenCalledWith('income-1', {
      category_id: 'income-salary',
      name: '薪金',
      amount: 1080,
      date: 1780185600000,
      edit_date: Date.now(),
      synced: false,
      trip_id: 'trip-tokyo',
      original_currency: 'CNY',
      original_amount: 1000,
      exchange_rate_hkd: 1.08,
    })
  })

  test('deletes expense and income transactions by id', async () => {
    await deleteExpense('expense-1')
    await deleteIncome('income-1')
    await deleteSaving('saving-1')

    expect(mockExpenseDelete).toHaveBeenCalledWith('expense-1')
    expect(mockIncomeDelete).toHaveBeenCalledWith('income-1')
    expect(mockSavingDelete).toHaveBeenCalledWith('saving-1')
  })

  test('imports mixed transaction types in one db transaction', async () => {
    await importTransactions([
      {
        type: 'expense',
        category_id: 'expense-food',
        name: '午餐',
        amount: 50,
        date: 1780185600000,
        trip_id: 'trip-tokyo',
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      },
      {
        type: 'income',
        category_id: 'income-salary',
        name: '薪金',
        amount: 1000,
        date: 1780185600000,
        trip_id: 'trip-tokyo',
        currency_code: 'CNY',
        exchange_rate_hkd: 1.08,
      },
      {
        type: 'saving',
        category_id: 'saving-stocks',
        name: 'VOO',
        amount: 200,
        date: 1780185600000,
        trip_id: 'trip-tokyo',
        currency_code: 'USD',
        exchange_rate_hkd: 7.8,
      },
    ])

    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    expect(mockExpenseAdd).toHaveBeenCalledTimes(1)
    expect(mockIncomeAdd).toHaveBeenCalledTimes(1)
    expect(mockSavingAdd).toHaveBeenCalledTimes(1)
    expect(mockExpenseAdd.mock.calls[0]?.[0]).toMatchObject({
      category_id: 'expense-food',
      name: '午餐',
      amount: 50,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      original_currency: 'HKD',
      original_amount: 50,
      exchange_rate_hkd: 1,
    })
    expect(mockIncomeAdd.mock.calls[0]?.[0]).toMatchObject({
      category_id: 'income-salary',
      name: '薪金',
      amount: 1080,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      original_currency: 'CNY',
      original_amount: 1000,
      exchange_rate_hkd: 1.08,
    })
    expect(mockSavingAdd.mock.calls[0]?.[0]).toMatchObject({
      category_id: 'saving-stocks',
      description: 'VOO',
      amount: 1560,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      original_currency: 'USD',
      original_amount: 200,
      exchange_rate_hkd: 7.8,
    })
  })

  test('updates a saving in HKD while preserving original currency reference fields', async () => {
    await updateSaving('saving-1', {
      category_id: 'saving-stocks',
      name: 'VOO',
      amount: 200,
      date: 1780185600000,
      trip_id: 'trip-tokyo',
      currency_code: 'USD',
      exchange_rate_hkd: 7.8,
    })

    expect(mockSavingUpdate).toHaveBeenCalledWith('saving-1', {
      category_id: 'saving-stocks',
      description: 'VOO',
      amount: 1560,
      date: 1780185600000,
      edit_date: Date.now(),
      synced: false,
      trip_id: 'trip-tokyo',
      original_currency: 'USD',
      original_amount: 200,
      exchange_rate_hkd: 7.8,
    })
  })

  test('saves and lists trips ordered by latest update first', async () => {
    mockTripGet.mockResolvedValueOnce(undefined)
    mockTripToArray.mockResolvedValueOnce([
      {
        trip_id: 'trip-osaka',
        name: 'Osaka',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 20000,
        budget_currency: 'JPY',
        status: 'planned',
        notes: 'Food crawl',
        created_at: 1780205700000,
        updated_at: 1780205600000,
      },
      {
        trip_id: 'trip-tokyo',
        name: 'Tokyo',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 15000,
        budget_currency: 'JPY',
        status: 'active',
        notes: 'Sakura',
        created_at: 1780205700000,
        updated_at: 1780205700000,
      },
    ])

    await saveTrip({
      name: 'Tokyo',
      destination: 'Japan',
      start_date: 1780185600000,
      end_date: 1780444800000,
      budget_amount: 15000,
      budget_currency: 'JPY',
      status: 'active',
      notes: ' Sakura ',
    })

    expect(mockTripPut).toHaveBeenCalledWith({
      trip_id: expect.stringMatching(/^trip-/),
      name: 'Tokyo',
      destination: 'Japan',
      start_date: 1780185600000,
      end_date: 1780444800000,
      budget_amount: 15000,
      budget_currency: 'JPY',
      status: 'active',
      notes: 'Sakura',
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    mockTripToArray.mockResolvedValueOnce([
      {
        trip_id: 'trip-osaka',
        name: 'Osaka',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 20000,
        budget_currency: 'JPY',
        status: 'planned',
        notes: 'Food crawl',
        created_at: 1780205700000,
        updated_at: 1780205600000,
      },
      {
        trip_id: 'trip-tokyo',
        name: 'Tokyo',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 15000,
        budget_currency: 'JPY',
        status: 'active',
        notes: 'Sakura',
        created_at: 1780205700000,
        updated_at: 1780205700000,
      },
    ])

    await expect(getTrips()).resolves.toEqual([
      {
        trip_id: 'trip-tokyo',
        name: 'Tokyo',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 15000,
        budget_currency: 'JPY',
        status: 'active',
        notes: 'Sakura',
        created_at: 1780205700000,
        updated_at: 1780205700000,
      },
      {
        trip_id: 'trip-osaka',
        name: 'Osaka',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 20000,
        budget_currency: 'JPY',
        status: 'planned',
        notes: 'Food crawl',
        created_at: 1780205700000,
        updated_at: 1780205600000,
      },
    ])
  })

  test('updates trip lifecycle fields while preserving original creation timestamp from the database', async () => {
    mockTripGet.mockResolvedValueOnce({
      trip_id: 'trip-kyoto',
      name: 'Kyoto',
      destination: 'Japan',
      start_date: 1780100000000,
      end_date: 1780444800000,
      budget_amount: 12000,
      budget_currency: 'JPY',
      status: 'planned',
      notes: 'Initial plan',
      created_at: 1780100000000,
      updated_at: 1780150000000,
    })

    await saveTrip(
      {
        name: 'Kyoto',
        destination: 'Japan',
        start_date: 1780185600000,
        end_date: 1780444800000,
        budget_amount: 18000,
        budget_currency: 'JPY',
        status: 'completed',
        notes: ' Temples ',
      },
      {
        trip_id: 'trip-kyoto',
      },
    )

    expect(mockTripPut).toHaveBeenCalledWith({
      trip_id: 'trip-kyoto',
      name: 'Kyoto',
      destination: 'Japan',
      start_date: 1780185600000,
      end_date: 1780444800000,
      budget_amount: 18000,
      budget_currency: 'JPY',
      status: 'completed',
      notes: 'Temples',
      created_at: 1780100000000,
      updated_at: Date.now(),
    })
  })

  test('rejects unknown trip ids when persisting trip-linked transactions', async () => {
    mockTripGet.mockResolvedValue(undefined)

    await expect(
      createExpense({
        category_id: 'expense-food',
        name: 'Lunch',
        amount: 12,
        date: 1780185600000,
        trip_id: 'trip-missing',
        currency_code: 'USD',
        exchange_rate_hkd: 7.8,
      }),
    ).rejects.toThrow('Unknown trip_id: trip-missing')

    await expect(
      createIncome({
        category_id: 'income-salary',
        name: 'Bonus',
        amount: 1000,
        date: 1780185600000,
        trip_id: 'trip-missing',
        currency_code: 'CNY',
        exchange_rate_hkd: 1.08,
      }),
    ).rejects.toThrow('Unknown trip_id: trip-missing')

    await expect(
      createSaving({
        category_id: 'saving-stocks',
        name: 'VOO',
        amount: 200,
        date: 1780185600000,
        trip_id: 'trip-missing',
        currency_code: 'USD',
        exchange_rate_hkd: 7.8,
      }),
    ).rejects.toThrow('Unknown trip_id: trip-missing')
  })

  test('rejects unknown trip ids during trip-linked updates and imports', async () => {
    mockTripGet.mockResolvedValue(undefined)

    await expect(
      updateExpense('expense-1', {
        category_id: 'expense-food',
        name: 'Lunch',
        amount: 12,
        date: 1780185600000,
        trip_id: 'trip-missing',
        currency_code: 'USD',
        exchange_rate_hkd: 7.8,
      }),
    ).rejects.toThrow('Unknown trip_id: trip-missing')

    await expect(
      importTransactions([
        {
          type: 'saving',
          category_id: 'saving-stocks',
          name: 'VOO',
          amount: 200,
          date: 1780185600000,
          trip_id: 'trip-missing',
          currency_code: 'USD',
          exchange_rate_hkd: 7.8,
        },
      ]),
    ).rejects.toThrow('Unknown trip_id: trip-missing')
  })

  test('persists active trip id in settings and can clear it', async () => {
    mockSettingFirst.mockResolvedValueOnce({
      setting_id: 'setting-active-trip-id',
      name: 'active_trip_id',
      parameter: 'trip-tokyo',
    })
    mockTripGet.mockResolvedValueOnce({
      trip_id: 'trip-tokyo',
      name: 'Tokyo',
      destination: 'Japan',
      start_date: 1780185600000,
      end_date: 1780444800000,
      budget_amount: 15000,
      budget_currency: 'JPY',
      status: 'active',
      notes: 'Sakura',
      created_at: 1780205700000,
      updated_at: 1780205700000,
    })
    mockSettingFirst.mockResolvedValueOnce({
      setting_id: 'setting-active-trip-id',
      name: 'active_trip_id',
      parameter: 'trip-tokyo',
    })
    mockSettingFirst.mockResolvedValueOnce(undefined)

    await setActiveTripId('trip-tokyo')
    await expect(getActiveTripId()).resolves.toBe('trip-tokyo')
    await setActiveTripId(undefined)
    await expect(getActiveTripId()).resolves.toBeUndefined()

    expect(mockSettingPut).toHaveBeenCalledWith({
      setting_id: 'setting-active-trip-id',
      name: 'active_trip_id',
      parameter: 'trip-tokyo',
    })
    expect(mockSettingDelete).toHaveBeenCalledWith('setting-active-trip-id')
  })

  test('creates restore preview and snapshot summaries from stored backups', async () => {
    mockSnapshotsToArray.mockResolvedValueOnce([
      {
        snapshot_id: 'snapshot-2',
        created_at: 300,
        reason: 'restore:before',
        payload_json:
          '{"cycles":[],"expenseCategories":[{"category_id":"expense-food","name_en":"Food","name_tc":"餐飲","color_code":"b5392a","icon_image_name":"utensils","custom":false,"deleted":false}],"incomeCategories":[],"expenses":[{"transaction_id":"expense-1","category_id":"expense-food","name":"Lunch","amount":50,"date":1780185600000,"create_date":1780185600000,"edit_date":1780185600000,"synced":false}],"incomes":[],"targetExpenses":[],"savings":[],"settings":[],"trips":[],"fxRates":[],"savingChallenges":[]}',
      },
      {
        snapshot_id: 'snapshot-1',
        created_at: 100,
        reason: 'expense:create',
        payload_json:
          '{"cycles":[],"expenseCategories":[],"incomeCategories":[],"expenses":[],"incomes":[],"targetExpenses":[],"savings":[],"settings":[],"trips":[],"fxRates":[],"savingChallenges":[]}',
      },
    ])

    await expect(getRecoverySnapshotSummaries()).resolves.toEqual([
      { snapshotId: 'snapshot-2', createdAt: 300, reason: 'restore:before' },
      { snapshotId: 'snapshot-1', createdAt: 100, reason: 'expense:create' },
    ])

    await expect(
      getRestorePreview(
        '{"cycles":[],"expenseCategories":[{"category_id":"expense-food","name_en":"Food","name_tc":"餐飲","color_code":"b5392a","icon_image_name":"utensils","custom":false,"deleted":false}],"incomeCategories":[],"expenses":[{"transaction_id":"expense-1","category_id":"expense-food","name":"Lunch","amount":50,"date":1780185600000,"create_date":1780185600000,"edit_date":1780185600000,"synced":false}],"incomes":[],"targetExpenses":[],"savings":[],"settings":[],"trips":[],"fxRates":[],"savingChallenges":[]}',
      ),
    ).resolves.toEqual({
      payload: {
        cycles: [],
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
        incomeCategories: [],
        expenses: [
          {
            transaction_id: 'expense-1',
            category_id: 'expense-food',
            name: 'Lunch',
            amount: 50,
            date: 1780185600000,
            create_date: 1780185600000,
            edit_date: 1780185600000,
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
      },
      impact: {
        cycles: 0,
        expenseCategories: 1,
        incomeCategories: 0,
        expenses: 1,
        incomes: 0,
        targetExpenses: 0,
        savings: 0,
        settings: 0,
        trips: 0,
        fxRates: 0,
        savingChallenges: 0,
      },
      integrity: { ok: true, errors: [] },
      errors: [],
    })
  })

  test('restores from a snapshot payload after validation passes', async () => {
    mockSnapshotsToArray.mockResolvedValueOnce([
      {
        snapshot_id: 'snapshot-restore',
        created_at: 300,
        reason: 'restore:before',
        payload_json:
          '{"cycles":[],"expenseCategories":[],"incomeCategories":[],"expenses":[],"incomes":[],"targetExpenses":[],"savings":[],"settings":[],"trips":[],"fxRates":[],"savingChallenges":[]}',
      },
    ])

    await restoreFromSnapshot('snapshot-restore')

    expect(mockDbTransaction).toHaveBeenCalled()
  })
})
