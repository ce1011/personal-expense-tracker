import { describe, expect, test } from 'vitest'

import {
  calculateSpareChange,
  getFrequentTransactions,
  parseQuickAddText,
  type QuickAddSuggestion,
} from './quickAdd'
import type { CombinedTransaction, ExpenseCategory } from '@/types/app-data'

const categories: ExpenseCategory[] = [
  {
    category_id: 'expense-food',
    name_en: 'Food',
    name_tc: '餐飲',
    color_code: 'b5392a',
    icon_image_name: 'utensils',
    custom: false,
    deleted: false,
  },
  {
    category_id: 'expense-transport',
    name_en: 'Transport',
    name_tc: '交通',
    color_code: '2f6f66',
    icon_image_name: 'train',
    custom: false,
    deleted: false,
  },
]

describe('getFrequentTransactions', () => {
  const now = 1_720_000_000_000

  test('returns empty array when there are no transactions', () => {
    expect(getFrequentTransactions([], 5, now)).toEqual([])
  })

  test('returns a suggestion for a recent transaction', () => {
    const transactions: CombinedTransaction[] = [
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: '麥當勞',
        date: now - 86_400_000,
      }),
    ]

    expect(getFrequentTransactions(transactions, 5, now)).toEqual([
      {
        kind: 'expense',
        category_id: 'expense-food',
        name: '麥當勞',
      } satisfies QuickAddSuggestion,
    ])
  })

  test('groups repeated transactions by name and category', () => {
    const transactions: CombinedTransaction[] = [
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: '麥當勞',
        date: now - 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: '麥當勞',
        date: now - 2 * 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-transport',
        name: 'MTR',
        date: now - 3 * 86_400_000,
      }),
    ]

    const result = getFrequentTransactions(transactions, 5, now)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      kind: 'expense',
      category_id: 'expense-food',
      name: '麥當勞',
    })
    expect(result[1]).toEqual({
      kind: 'expense',
      category_id: 'expense-transport',
      name: 'MTR',
    })
  })

  test('ignores transactions older than 90 days', () => {
    const transactions: CombinedTransaction[] = [
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: 'Old',
        date: now - 91 * 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: 'Recent',
        date: now - 86_400_000,
      }),
    ]

    const result = getFrequentTransactions(transactions, 5, now)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Recent')
  })

  test('respects the limit', () => {
    const transactions: CombinedTransaction[] = [
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-food',
        name: 'A',
        date: now - 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-transport',
        name: 'B',
        date: now - 86_400_000,
      }),
      makeTransaction({
        kind: 'expense',
        category_id: 'expense-home',
        name: 'C',
        date: now - 86_400_000,
      }),
    ]

    expect(getFrequentTransactions(transactions, 2, now)).toHaveLength(2)
  })
})

describe('parseQuickAddText', () => {
  test('parses name and amount separated by space', () => {
    expect(parseQuickAddText('麥當勞 55', categories)).toEqual({
      name: '麥當勞',
      amount: 55,
    })
  })

  test('parses decimal amounts', () => {
    expect(parseQuickAddText('交通 12.5', categories)).toEqual({
      name: '交通',
      amount: 12.5,
      category_id: 'expense-transport',
    })
  })

  test('matches category by English name', () => {
    expect(parseQuickAddText('Food 100', categories)).toEqual({
      name: 'Food',
      amount: 100,
      category_id: 'expense-food',
    })
  })

  test('returns null when text does not contain an amount', () => {
    expect(parseQuickAddText('麥當勞', categories)).toBeNull()
  })

  test('returns null for empty text', () => {
    expect(parseQuickAddText('', categories)).toBeNull()
  })
})

describe('calculateSpareChange', () => {
  test('rounds up to the nearest 10 and returns spare change', () => {
    expect(calculateSpareChange(55)).toEqual({ roundedAmount: 60, spareChange: 5 })
  })

  test('returns zero spare change when amount is already a multiple of 10', () => {
    expect(calculateSpareChange(60)).toEqual({ roundedAmount: 60, spareChange: 0 })
  })

  test('handles decimal amounts', () => {
    expect(calculateSpareChange(12.5)).toEqual({ roundedAmount: 20, spareChange: 7.5 })
  })
})

function makeTransaction(
  partial: Pick<CombinedTransaction, 'kind' | 'category_id' | 'name' | 'date'>,
): CombinedTransaction {
  return {
    id: 'txn-1',
    kind: partial.kind,
    category_id: partial.category_id,
    name: partial.name,
    amount: 100,
    date: partial.date,
  }
}
