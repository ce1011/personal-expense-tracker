import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import TransactionListItem from './TransactionListItem.vue'
import type { CombinedTransaction, ExpenseCategory, IncomeCategory } from '@/types/app-data'

const expenseCategories: ExpenseCategory[] = [
  {
    category_id: 'food',
    name_en: 'Food',
    name_tc: '食物',
    color_code: '#ff0000',
    icon_image_name: 'utensils',
    custom: false,
    deleted: false,
  },
]

const incomeCategories: IncomeCategory[] = [
  {
    category_id: 'salary',
    name_en: 'Salary',
    name_tc: '薪金',
    color_code: '#00ff00',
    icon_image_name: 'banknote',
    custom: false,
    deleted: false,
  },
]

const baseExpense: CombinedTransaction = {
  id: 'expense-1',
  kind: 'expense',
  category_id: 'food',
  name: 'Lunch',
  amount: 120,
  date: new Date(2026, 6, 4, 12, 0, 0).getTime(),
}

function mountItem(item: CombinedTransaction, currency = 'HKD') {
  return mount(TransactionListItem, {
    props: {
      item,
      expenseCategories,
      incomeCategories,
      currency,
    },
  })
}

describe('TransactionListItem', () => {
  test('renders expense name, category, date and amount', () => {
    const wrapper = mountItem(baseExpense)
    expect(wrapper.text()).toContain('Lunch')
    expect(wrapper.text()).toContain('食物')
    expect(wrapper.text()).toContain('HK$120')
  })

  test('renders income with positive styling', () => {
    const item: CombinedTransaction = {
      ...baseExpense,
      id: 'income-1',
      kind: 'income',
      category_id: 'salary',
      name: 'Salary',
      amount: 10000,
    }
    const wrapper = mountItem(item)
    expect(wrapper.text()).toContain('+HK$10,000')
    expect(wrapper.find('.text-primary').exists()).toBe(true)
  })

  test('renders saving transaction', () => {
    const item: CombinedTransaction = {
      ...baseExpense,
      id: 'saving-1',
      kind: 'saving',
      category_id: 'saving-cash',
      name: 'Emergency fund',
      amount: 500,
    }
    const wrapper = mountItem(item)
    expect(wrapper.text()).toContain('Emergency fund')
    expect(wrapper.text()).toContain('HK$500')
  })

  test('emits select event with the item when clicked', async () => {
    const wrapper = mountItem(baseExpense)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([baseExpense])
  })

  test('shows original currency when it differs from display currency', () => {
    const item: CombinedTransaction = {
      ...baseExpense,
      original_currency: 'JPY',
      original_amount: 2000,
    }
    const wrapper = mountItem(item)
    expect(wrapper.text()).toContain('原幣：JPY 2000')
  })

  test('does not show original currency when it matches display currency', () => {
    const item: CombinedTransaction = {
      ...baseExpense,
      original_currency: 'HKD',
      original_amount: 120,
    }
    const wrapper = mountItem(item)
    expect(wrapper.text()).not.toContain('原幣')
  })

  test('falls back to 未分類 when category is missing', () => {
    const item: CombinedTransaction = {
      ...baseExpense,
      category_id: 'unknown',
    }
    const wrapper = mountItem(item)
    expect(wrapper.text()).toContain('未分類')
  })
})
