import { describe, expect, test } from 'vitest'
import type { ExpenseCategory, ExpenseTransaction, TargetExpenseLimit } from '@/types/app-data'
import { getCategoryAlerts } from './categoryAlerts'

function expense(category_id: string, amount: number, date: string): ExpenseTransaction {
  return {
    transaction_id: 'expense-1',
    category_id,
    name: 'Test',
    amount,
    date: new Date(date).getTime(),
    create_date: Date.now(),
    edit_date: Date.now(),
    synced: false,
  }
}

function category(id: string): ExpenseCategory {
  return {
    category_id: id,
    name_en: id,
    name_tc: id,
    color_code: '000000',
    icon_image_name: 'circle',
    custom: false,
    deleted: false,
  }
}

describe('getCategoryAlerts', () => {
  const window = {
    start: new Date('2026-07-01').getTime(),
    end: new Date('2026-08-01').getTime(),
    label: '',
  }
  const categories = [category('food'), category('transport')]
  const targets: TargetExpenseLimit[] = [
    { target_expense_id: 't1', cycle_id: 'cycle-1', category_id: 'food', amount: 1000 },
  ]

  test('marks category as ok when under 80%', () => {
    const expenses = [expense('food', 700, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window, 'cycle-1')

    expect(result[0]?.severity).toBe('ok')
    expect(result[0]?.percentage).toBe(70)
  })

  test('marks category as warning at 80%', () => {
    const expenses = [expense('food', 800, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window, 'cycle-1')

    expect(result[0]?.severity).toBe('warning')
  })

  test('marks category as danger over 100%', () => {
    const expenses = [expense('food', 1200, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window, 'cycle-1')

    expect(result[0]?.severity).toBe('danger')
    expect(result[0]?.remaining).toBe(-200)
  })

  test('marks category at exactly 100% as warning instead of overspent', () => {
    const expenses = [expense('food', 1000, '2026-07-02')]
    const result = getCategoryAlerts(expenses, targets, categories, window, 'cycle-1')

    expect(result[0]?.severity).toBe('warning')
    expect(result[0]?.remaining).toBe(0)
  })

  test('uses only targets from the current cycle', () => {
    const result = getCategoryAlerts(
      [expense('food', 900, '2026-07-02')],
      [
        { target_expense_id: 'old', cycle_id: 'cycle-0', category_id: 'food', amount: 1000 },
        { target_expense_id: 'current', cycle_id: 'cycle-1', category_id: 'food', amount: 1200 },
      ],
      categories,
      window,
      'cycle-1',
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.target).toBe(1200)
    expect(result[0]?.percentage).toBe(75)
  })
})
