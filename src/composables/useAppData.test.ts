import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ExpenseCategory, SavingChallenge, TripSession } from '@/types/app-data'
import { useAppData } from './useAppData'

const {
  mockListExpenseCategories,
  mockListIncomeCategories,
  mockListTrips,
  mockListSavingChallenges,
  mockGetCurrency,
  mockGetFxContext,
  mockGetActiveTripId,
  mockCreateExpense,
  mockSoftDeleteExpenseCategory,
  mockSetActiveTripId,
  mockSaveTrip,
  mockGetRecoverySnapshotSummaries,
} = vi.hoisted(() => ({
  mockListExpenseCategories: vi.fn(),
  mockListIncomeCategories: vi.fn(),
  mockListTrips: vi.fn(),
  mockListSavingChallenges: vi.fn(),
  mockGetCurrency: vi.fn(),
  mockGetFxContext: vi.fn(),
  mockGetActiveTripId: vi.fn(),
  mockCreateExpense: vi.fn(),
  mockSoftDeleteExpenseCategory: vi.fn(),
  mockSetActiveTripId: vi.fn(),
  mockSaveTrip: vi.fn(),
  mockGetRecoverySnapshotSummaries: vi.fn(),
}))

vi.mock('@/services/appDataService', () => ({
  listExpenseCategories: mockListExpenseCategories,
  listIncomeCategories: mockListIncomeCategories,
  listTrips: mockListTrips,
  listSavingChallenges: mockListSavingChallenges,
  getCurrency: mockGetCurrency,
  getFxContext: mockGetFxContext,
  getActiveTripId: mockGetActiveTripId,
  createExpense: mockCreateExpense,
  createIncome: vi.fn(),
  createSaving: vi.fn(),
  createSavingChallenge: vi.fn(),
  deleteExpense: vi.fn(),
  deleteIncome: vi.fn(),
  deleteSaving: vi.fn(),
  deleteSavingChallenge: vi.fn(),
  exportBackup: vi.fn(),
  getRecoverySnapshotSummaries: mockGetRecoverySnapshotSummaries,
  getRestorePreview: vi.fn(),
  importTransactions: vi.fn(),
  replaceAllDataWithSnapshot: vi.fn(),
  restoreFromSnapshot: vi.fn(),
  saveCycle: vi.fn(),
  saveExpenseCategory: vi.fn(),
  saveIncomeCategory: vi.fn(),
  saveTargetLimit: vi.fn(),
  saveTrip: mockSaveTrip,
  setActiveTripId: mockSetActiveTripId,
  softDeleteExpenseCategory: mockSoftDeleteExpenseCategory,
  softDeleteIncomeCategory: vi.fn(),
  updateExpense: vi.fn(),
  updateIncome: vi.fn(),
  updateSaving: vi.fn(),
  updateSavingChallenge: vi.fn(),
}))

function makeCategory(overrides: Partial<ExpenseCategory> = {}): ExpenseCategory {
  return {
    category_id: 'food',
    name_en: 'Food',
    name_tc: '飲食',
    color_code: 'ff0000',
    icon_image_name: 'food',
    custom: true,
    deleted: false,
    ...overrides,
  }
}

function makeTrip(overrides: Partial<TripSession> = {}): TripSession {
  return {
    trip_id: 'trip-1',
    name: 'Tokyo',
    destination: 'Japan',
    start_date: 1,
    end_date: 2,
    budget_amount: 10000,
    budget_currency: 'JPY',
    status: 'active',
    notes: '',
    created_at: 1,
    updated_at: 1,
    ...overrides,
  }
}

function makeChallenge(overrides: Partial<SavingChallenge> = {}): SavingChallenge {
  return {
    challenge_id: 'challenge-1',
    name: 'Emergency',
    target_amount: 1000,
    status: 'active',
    created_at: 1,
    updated_at: 1,
    ...overrides,
  } as SavingChallenge
}

/** Mount a host component that captures the store, so lifecycle hooks run. */
function captureStore() {
  let store: ReturnType<typeof useAppData> | undefined
  const Host = defineComponent({
    setup() {
      store = useAppData()
      return () => h('div')
    },
  })
  mount(Host)
  if (!store) {
    throw new Error('store was not captured')
  }
  return store
}

beforeEach(() => {
  vi.clearAllMocks()
  mockListExpenseCategories.mockResolvedValue([])
  mockListIncomeCategories.mockResolvedValue([])
  mockListTrips.mockResolvedValue([])
  mockListSavingChallenges.mockResolvedValue([])
  mockGetCurrency.mockResolvedValue('HKD')
  mockGetFxContext.mockResolvedValue({
    fxRateMap: new Map([['HKD', 1]]),
    latestFxDate: '',
  })
  mockGetActiveTripId.mockResolvedValue(undefined)
})

describe('useAppData context', () => {
  test('refreshContext loads and exposes the shared context', async () => {
    mockListExpenseCategories.mockResolvedValue([
      makeCategory({ category_id: 'active-1' }),
      makeCategory({ category_id: 'deleted-1', deleted: true }),
    ])
    mockListTrips.mockResolvedValue([makeTrip()])
    mockListSavingChallenges.mockResolvedValue([makeChallenge()])
    mockGetCurrency.mockResolvedValue('JPY')
    mockGetFxContext.mockResolvedValue({
      fxRateMap: new Map([
        ['HKD', 1],
        ['JPY', 0.05],
      ]),
      latestFxDate: '2026-07-03',
    })
    mockGetActiveTripId.mockResolvedValue('trip-1')

    const store = captureStore()
    await store.refreshContext()

    expect(store.expenseCategories.value.map((c) => c.category_id)).toEqual([
      'active-1',
      'deleted-1',
    ])
    expect(store.activeExpenseCategories.value.map((c) => c.category_id)).toEqual(['active-1'])
    expect(store.trips.value).toHaveLength(1)
    expect(store.currency.value).toBe('JPY')
    expect(store.fxRateMap.value.get('JPY')).toBe(0.05)
    expect(store.latestFxDate.value).toBe('2026-07-03')
    expect(store.savingChallenges.value).toHaveLength(1)
    expect(store.activeTripId.value).toBe('trip-1')
    expect(store.activeTrip.value?.trip_id).toBe('trip-1')
    expect(store.error.value).toBe('')
  })

  test('clears an active trip id that no longer matches a trip', async () => {
    mockListTrips.mockResolvedValue([])
    mockGetActiveTripId.mockResolvedValue('ghost-trip')

    const store = captureStore()
    await store.refreshContext()

    expect(store.activeTripId.value).toBe('')
    expect(store.activeTrip.value).toBeUndefined()
  })

  test('surfaces an error message when the context fails to load', async () => {
    mockListExpenseCategories.mockRejectedValue(new Error('network down'))

    const store = captureStore()
    await store.refreshContext()

    expect(store.error.value).toBe('network down')
    expect(store.loading.value).toBe(false)
  })
})

describe('useAppData actions', () => {
  test('a transaction mutation bumps contextVersion without reloading context', async () => {
    mockCreateExpense.mockResolvedValue(undefined)
    const store = captureStore()
    const versionBefore = store.contextVersion.value

    await store.addExpense({
      category_id: 'food',
      name: 'Lunch',
      amount: 50,
      date: 1,
      currency_code: 'HKD',
      exchange_rate_hkd: 1,
    })

    expect(mockCreateExpense).toHaveBeenCalled()
    expect(store.contextVersion.value).toBe(versionBefore + 1)
    expect(mockListExpenseCategories).not.toHaveBeenCalled()
  })

  test('a context mutation reloads the shared context after succeeding', async () => {
    mockSoftDeleteExpenseCategory.mockResolvedValue(undefined)
    mockListExpenseCategories.mockResolvedValue([makeCategory()])
    const store = captureStore()
    const versionBefore = store.contextVersion.value

    await store.deleteExpenseCategory('food')

    expect(mockSoftDeleteExpenseCategory).toHaveBeenCalledWith('food')
    expect(store.contextVersion.value).toBe(versionBefore + 1)
    expect(mockListExpenseCategories).toHaveBeenCalled()
    expect(store.expenseCategories.value).toHaveLength(1)
  })

  test('setActiveTrip reloads context and updates the active trip', async () => {
    mockSetActiveTripId.mockResolvedValue(undefined)
    mockListTrips.mockResolvedValue([makeTrip()])
    mockGetActiveTripId.mockResolvedValue('trip-1')
    const store = captureStore()

    await store.setActiveTrip('trip-1')

    expect(mockSetActiveTripId).toHaveBeenCalledWith('trip-1')
    expect(store.activeTripId.value).toBe('trip-1')
  })

  test('completeTrip saves the trip with a completed status', async () => {
    mockListTrips.mockResolvedValue([makeTrip()])
    mockGetActiveTripId.mockResolvedValue('trip-1')
    mockSaveTrip.mockResolvedValue(undefined)
    const store = captureStore()
    await store.refreshContext()

    await store.completeTrip('trip-1')

    expect(mockSaveTrip).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
      expect.objectContaining({ trip_id: 'trip-1' }),
    )
  })

  test('loadRecoverySnapshots populates the snapshot list', async () => {
    mockGetRecoverySnapshotSummaries.mockResolvedValue([
      { snapshotId: 's1', createdAt: 100, reason: 'expense:create' },
    ])
    const store = captureStore()

    await store.loadRecoverySnapshots()

    expect(store.recoverySnapshots.value).toEqual([
      { snapshotId: 's1', createdAt: 100, reason: 'expense:create' },
    ])
  })

  test('a failed mutation records an error and rethrows', async () => {
    mockCreateExpense.mockRejectedValue(new Error('save failed'))
    const store = captureStore()

    await expect(
      store.addExpense({
        category_id: 'food',
        name: 'Lunch',
        amount: 50,
        date: 1,
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      }),
    ).rejects.toThrow('save failed')

    expect(store.error.value).toBe('save failed')
  })
})
