import { describe, expect, test } from 'vitest'

import { parseTransactionImportJson } from './transactionImport'

const expenseCategories = [
  {
    category_id: 'expense-food',
    name_en: 'Food',
    name_tc: '餐飲',
    color_code: 'b5392a',
    icon_image_name: 'utensils',
    custom: false,
    deleted: false,
  },
]

const incomeCategories = [
  {
    category_id: 'income-salary',
    name_en: 'Salary',
    name_tc: '薪金',
    color_code: '2f6f66',
    icon_image_name: 'wallet',
    custom: false,
    deleted: false,
  },
]

const fxRateMap = new Map([
  ['HKD', 1],
  ['USD', 7.8],
  ['CNY', 1.08],
  ['JPY', 0.054],
  ['TWD', 0.24],
  ['THB', 0.22],
] as const)

describe('parseTransactionImportJson', () => {
  test('parses expense, income, and saving transactions using cached fx rates by default', () => {
    const result = parseTransactionImportJson(
      JSON.stringify([
        {
          type: 'expense',
          category_id: 'expense-food',
          name: '午餐',
          amount: 58,
          date: 1780070400000,
          currency_code: 'HKD',
        },
        {
          type: 'income',
          category_id: 'income-salary',
          name: '薪金',
          amount: 1000,
          date: 1780070400000,
          currency_code: 'CNY',
        },
        {
          type: 'saving',
          category_id: 'saving-stocks',
          name: '買 VOO',
          amount: 300,
          date: 1780070400000,
          currency_code: 'USD',
        },
      ]),
      {
        expenseCategories,
        incomeCategories,
        fxRateMap,
      },
    )

    expect(result.errors).toEqual([])
    expect(result.transactions).toEqual([
      {
        type: 'expense',
        category_id: 'expense-food',
        name: '午餐',
        amount: 58,
        date: 1780070400000,
        currency_code: 'HKD',
        exchange_rate_hkd: 1,
      },
      {
        type: 'income',
        category_id: 'income-salary',
        name: '薪金',
        amount: 1000,
        date: 1780070400000,
        currency_code: 'CNY',
        exchange_rate_hkd: 1.08,
      },
      {
        type: 'saving',
        category_id: 'saving-stocks',
        name: '買 VOO',
        amount: 300,
        date: 1780070400000,
        currency_code: 'USD',
        exchange_rate_hkd: 7.8,
      },
    ])
    expect(result.summary).toEqual({
      total: 3,
      expenseCount: 1,
      incomeCount: 1,
      savingCount: 1,
      currencies: ['CNY', 'HKD', 'USD'],
    })
  })

  test('accepts explicit exchange rate override from JSON', () => {
    const result = parseTransactionImportJson(
      JSON.stringify([
        {
          type: 'saving',
          category_id: 'saving-cash',
          name: '美元現金',
          amount: 50,
          date: 1780070400000,
          currency_code: 'USD',
          exchange_rate_hkd: 7.76,
        },
      ]),
      {
        expenseCategories,
        incomeCategories,
        fxRateMap,
      },
    )

    expect(result.errors).toEqual([])
    expect(result.transactions[0]?.exchange_rate_hkd).toBe(7.76)
  })

  test('returns validation errors for unsupported type, category, missing fx rate, and second-based timestamps', () => {
    const result = parseTransactionImportJson(
      JSON.stringify([
        {
          type: 'transfer',
          category_id: 'expense-food',
          name: '錯類型',
          amount: 10,
          date: 1780070400000,
          currency_code: 'HKD',
        },
        {
          type: 'expense',
          category_id: 'missing-category',
          name: '錯分類',
          amount: 10,
          date: 1780070400000,
          currency_code: 'HKD',
        },
        {
          type: 'income',
          category_id: 'income-salary',
          name: '錯匯率',
          amount: 10,
          date: 1780070400000,
          currency_code: 'THB',
        },
        {
          type: 'saving',
          category_id: 'saving-cash',
          name: '秒級時間',
          amount: 10,
          date: 1780070400,
          currency_code: 'HKD',
        },
      ]),
      {
        expenseCategories,
        incomeCategories,
        fxRateMap: new Map([
          ['HKD', 1],
          ['USD', 7.8],
          ['CNY', 1.08],
          ['JPY', 0.054],
          ['TWD', 0.24],
        ] as const),
      },
    )

    expect(result.transactions).toEqual([])
    expect(result.errors).toEqual([
      '第 1 筆：type 必須是 expense、income 或 saving',
      '第 2 筆：category_id 不存在或不屬於該交易類型',
      '第 3 筆：缺少 THB 的匯率，請先讓 app 更新匯率或在 JSON 提供 exchange_rate_hkd',
      '第 4 筆：date 必須是毫秒 Unix timestamp',
    ])
  })

  test('rejects non-array JSON payloads', () => {
    const result = parseTransactionImportJson(
      JSON.stringify({ hello: 'world' }),
      {
        expenseCategories,
        incomeCategories,
        fxRateMap,
      },
    )

    expect(result.transactions).toEqual([])
    expect(result.errors).toEqual(['JSON 內容必須是陣列'])
  })
})
