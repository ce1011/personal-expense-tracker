import { computed, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockTransactionsList } = vi.hoisted(() => ({
  mockTransactionsList: vi.fn(),
}))

const appData = {
  currency: computed(() => 'HKD'),
  fxRateMap: computed(() =>
    new Map([
      ['HKD', 1],
      ['USD', 7.8],
    ]),
  ),
  latestFxDate: computed(() => '2026-07-20'),
  activeTripId: computed(() => ''),
  mutationVersion: vi.fn(() => computed(() => 0)),
}

vi.mock('@/api/client', () => ({
  api: {
    transactionsQuery: {
      list: mockTransactionsList,
    },
  },
}))

vi.mock('@/composables/useAppData', () => ({
  useAppData: () => appData,
}))

import { useTransactionsQuery } from './useTransactionsQuery'

function captureQuery() {
  let query: ReturnType<typeof useTransactionsQuery> | undefined
  const Host = defineComponent({
    setup() {
      query = useTransactionsQuery()
      return () => h('div')
    },
  })
  mount(Host)
  if (!query) throw new Error('query was not captured')
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
  mockTransactionsList.mockResolvedValue({
    groups: [],
    page: { next_cursor: null, has_more: false },
    options: {
      trips: [],
      expenseCategories: [],
      incomeCategories: [],
      savingCategories: [],
      activeTripId: '',
    },
    currency: 'HKD',
    expenseCategories: [],
    incomeCategories: [],
    savingChallenges: [],
    fxRateMap: { HKD: 1 },
    latestFxDate: '',
  })
})

describe('useTransactionsQuery', () => {
  test('keeps refreshed global rates when an older aggregate has only fallback FX data', async () => {
    const query = captureQuery()
    await query.refresh()
    await nextTick()

    expect(query.fxRateMap.value.get('USD')).toBe(7.8)
    expect(query.latestFxDate.value).toBe('2026-07-20')
  })

  test('loads the next cursor page and appends matching date groups', async () => {
    mockTransactionsList
      .mockResolvedValueOnce({
        groups: [
          {
            label: '今天',
            items: [
              {
                id: 'expense-2',
                kind: 'expense',
                category_id: 'food',
                name: 'Dinner',
                amount: 80,
                date: 2,
              },
            ],
          },
        ],
        page: { next_cursor: 'cursor-2', has_more: true },
        options: {
          trips: [],
          expenseCategories: [],
          incomeCategories: [],
          savingCategories: [],
          activeTripId: '',
        },
        currency: 'HKD',
        expenseCategories: [],
        incomeCategories: [],
        savingChallenges: [],
        fxRateMap: { HKD: 1 },
        latestFxDate: '',
      })
      .mockResolvedValueOnce({
        groups: [
          {
            label: '今天',
            items: [
              {
                id: 'expense-1',
                kind: 'expense',
                category_id: 'food',
                name: 'Lunch',
                amount: 50,
                date: 1,
              },
            ],
          },
        ],
        page: { next_cursor: null, has_more: false },
        options: {
          trips: [],
          expenseCategories: [],
          incomeCategories: [],
          savingCategories: [],
          activeTripId: '',
        },
        currency: 'HKD',
        expenseCategories: [],
        incomeCategories: [],
        savingChallenges: [],
        fxRateMap: { HKD: 1 },
        latestFxDate: '',
      })

    const query = captureQuery()
    await query.refresh()
    await query.loadMore()

    expect(mockTransactionsList).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'cursor-2', limit: 50 }),
    )
    expect(query.groups.value[0]?.items.map((item) => item.id)).toEqual([
      'expense-2',
      'expense-1',
    ])
    expect(query.hasMore.value).toBe(false)
  })
})
