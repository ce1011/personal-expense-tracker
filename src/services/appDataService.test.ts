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
} = vi.hoisted(() => ({
  mockDbTransaction: vi.fn(async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback()),
  mockExpenseAdd: vi.fn(),
  mockIncomeAdd: vi.fn(),
  mockSavingAdd: vi.fn(),
  mockExpenseUpdate: vi.fn(),
  mockIncomeUpdate: vi.fn(),
  mockSavingUpdate: vi.fn(),
  mockExpenseDelete: vi.fn(),
  mockIncomeDelete: vi.fn(),
  mockSavingDelete: vi.fn(),
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
  },
  createInitialPayload: vi.fn(),
}))

import {
  deleteExpense,
  deleteIncome,
  deleteSaving,
  importTransactions,
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
  })

  test('updates an expense in HKD while preserving original currency reference fields', async () => {
    await updateExpense('expense-1', {
      category_id: 'expense-food',
      name: '午餐',
      amount: 12,
      date: 1780185600000,
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
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      },
      {
        type: 'income',
        category_id: 'income-salary',
        name: '薪金',
        amount: 1000,
        date: 1780185600000,
        currency_code: 'CNY',
        exchange_rate_hkd: 1.08,
      },
      {
        type: 'saving',
        category_id: 'saving-stocks',
        name: 'VOO',
        amount: 200,
        date: 1780185600000,
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
      original_currency: 'HKD',
      original_amount: 50,
      exchange_rate_hkd: 1,
    })
    expect(mockIncomeAdd.mock.calls[0]?.[0]).toMatchObject({
      category_id: 'income-salary',
      name: '薪金',
      amount: 1080,
      date: 1780185600000,
      original_currency: 'CNY',
      original_amount: 1000,
      exchange_rate_hkd: 1.08,
    })
    expect(mockSavingAdd.mock.calls[0]?.[0]).toMatchObject({
      category_id: 'saving-stocks',
      description: 'VOO',
      amount: 1560,
      date: 1780185600000,
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
      original_currency: 'USD',
      original_amount: 200,
      exchange_rate_hkd: 7.8,
    })
  })
})
