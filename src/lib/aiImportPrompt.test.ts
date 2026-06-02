import { describe, expect, test } from 'vitest'

import { buildAiImportPrompt } from './aiImportPrompt'

describe('buildAiImportPrompt', () => {
  test('includes dynamic expense, income, and saving categories plus output rules', () => {
    const prompt = buildAiImportPrompt({
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
      incomeCategories: [
        {
          category_id: 'income-salary',
          name_en: 'Salary',
          name_tc: '薪金',
          color_code: '2f6f66',
          icon_image_name: 'wallet',
          custom: false,
          deleted: false,
        },
      ],
      savingCategories: [
        {
          category_id: 'saving-stocks',
          name_en: 'Stocks',
          name_tc: '股票',
          color_code: '7b6d3d',
          icon_image_name: 'chart-column',
        },
      ],
    })

    expect(prompt).toContain('你只能輸出 JSON array')
    expect(prompt).toContain('股票交易照片、外賣單據、購物單據')
    expect(prompt).toContain('- expense-food: 餐飲 / Food')
    expect(prompt).toContain('- income-salary: 薪金 / Salary')
    expect(prompt).toContain('- saving-stocks: 股票 / Stocks')
    expect(prompt).toContain('"type": "saving"')
    expect(prompt).toContain('date 必須輸出為 Unix timestamp in milliseconds')
  })
})
