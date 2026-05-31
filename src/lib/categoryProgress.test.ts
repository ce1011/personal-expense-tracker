import { describe, expect, test } from 'vitest'

import type { ExpenseCategory, ExpenseTransaction, TargetExpenseLimit } from '@/types/app-data'
import { buildCategoryProgressRows } from './categoryProgress'

const categories: ExpenseCategory[] = [
  {
    category_id: 'food',
    name_en: 'Food',
    name_tc: '餐飲',
    color_code: 'b5392a',
    icon_image_name: 'utensils',
    custom: false,
    deleted: false,
  },
  {
    category_id: 'transport',
    name_en: 'Transport',
    name_tc: '交通',
    color_code: '2f6f66',
    icon_image_name: 'train',
    custom: false,
    deleted: false,
  },
]

const targetExpenses: TargetExpenseLimit[] = [
  { target_expense_id: 'food-target', cycle_id: 'cycle-1', category_id: 'food', amount: 500 },
  { target_expense_id: 'transport-target', cycle_id: 'cycle-1', category_id: 'transport', amount: 100 },
]

describe('buildCategoryProgressRows', () => {
  test('aggregates spending against category targets', () => {
    const expenses: ExpenseTransaction[] = [
      {
        transaction_id: 'expense-1',
        category_id: 'food',
        name: '午餐',
        amount: 120,
        date: 1780272000000,
        create_date: 1780272000000,
        edit_date: 1780272000000,
        synced: false,
      },
      {
        transaction_id: 'expense-2',
        category_id: 'food',
        name: '晚餐',
        amount: 80,
        date: 1780272000000,
        create_date: 1780272000000,
        edit_date: 1780272000000,
        synced: false,
      },
    ]

    const rows = buildCategoryProgressRows(categories, expenses, targetExpenses, 'cycle-1')

    expect(rows[0]?.spent).toBe(200)
    expect(rows[0]?.target).toBe(500)
    expect(rows[0]?.ratio).toBe(0.4)
    expect(rows[1]?.spent).toBe(0)
  })

  test('caps progress at 100 percent', () => {
    const expenses: ExpenseTransaction[] = [
      {
        transaction_id: 'expense-1',
        category_id: 'transport',
        name: '的士',
        amount: 180,
        date: 1780272000000,
        create_date: 1780272000000,
        edit_date: 1780272000000,
        synced: false,
      },
    ]

    const rows = buildCategoryProgressRows(categories, expenses, targetExpenses, 'cycle-1')

    expect(rows[1]?.ratio).toBe(1)
  })

  test('supports dividing the category limit for daily view', () => {
    const expenses: ExpenseTransaction[] = [
      {
        transaction_id: 'expense-1',
        category_id: 'food',
        name: '早餐',
        amount: 30,
        date: 1780272000000,
        create_date: 1780272000000,
        edit_date: 1780272000000,
        synced: false,
      },
    ]

    const rows = buildCategoryProgressRows(categories, expenses, targetExpenses, 'cycle-1', 10)

    expect(rows[0]?.target).toBe(50)
    expect(rows[0]?.ratio).toBe(0.6)
  })
})
