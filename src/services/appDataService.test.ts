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
}))

vi.mock('@/db/database', () => ({
  db: {
    transaction: mockDbTransaction,
    expenses: {
      add: mockExpenseAdd,
      update: mockExpenseUpdate,
      delete: mockExpenseDelete,
    },
    incomes: {
      add: mockIncomeAdd,
      update: mockIncomeUpdate,
      delete: mockIncomeDelete,
    },
    savings: {
      add: mockSavingAdd,
      update: mockSavingUpdate,
      delete: mockSavingDelete,
    },
    trips: {
      put: mockTripPut,
      get: mockTripGet,
      toArray: mockTripToArray,
    },
    settings: {
      put: mockSettingPut,
      delete: mockSettingDelete,
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: mockSettingFirst,
        })),
      })),
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
  getTrips,
  importTransactions,
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
    mockTripToArray.mockReset()
    mockSettingPut.mockReset()
    mockSettingFirst.mockReset()
    mockSettingDelete.mockReset()
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

  test('rejects unknown active trip ids', async () => {
    mockTripGet.mockResolvedValueOnce(undefined)

    await expect(setActiveTripId('trip-missing')).rejects.toThrow('Unknown trip_id: trip-missing')
    expect(mockSettingPut).not.toHaveBeenCalled()
  })
})
