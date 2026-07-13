import { describe, expect, test } from 'vitest'

import type { CategoryProgressRow } from './categoryProgress'
import { buildCategoryBudgetInsights } from './categoryBudgetInsights'

const rows: CategoryProgressRow[] = [
  {
    category: {
      category_id: 'food',
      name_en: 'Food',
      name_tc: '餐飲',
      color_code: 'b5392a',
      icon_image_name: 'utensils',
      custom: false,
      deleted: false,
    },
    target: 100,
    spent: 120,
    ratio: 1,
    remaining: 0,
  },
  {
    category: {
      category_id: 'transport',
      name_en: 'Transport',
      name_tc: '交通',
      color_code: '2f6f66',
      icon_image_name: 'train',
      custom: false,
      deleted: false,
    },
    target: 80,
    spent: 64,
    ratio: 0.8,
    remaining: 16,
  },
  {
    category: {
      category_id: 'other',
      name_en: 'Other',
      name_tc: '其他',
      color_code: '6f6a61',
      icon_image_name: 'circle-dot',
      custom: false,
      deleted: false,
    },
    target: 0,
    spent: 20,
    ratio: 0,
    remaining: 0,
  },
]

describe('buildCategoryBudgetInsights', () => {
  test('summarizes budget health across rows', () => {
    const insights = buildCategoryBudgetInsights(rows)

    expect(insights.totalTarget).toBe(180)
    expect(insights.totalSpent).toBe(204)
    expect(insights.totalRemaining).toBe(-24)
    expect(insights.utilizationRate).toBe(1)
    expect(insights.overBudgetCount).toBe(1)
    expect(insights.nearLimitCount).toBe(1)
    expect(insights.unplannedCount).toBe(1)
    expect(insights.activeCategories).toBe(3)
    expect(insights.topSpentRow?.category.category_id).toBe('food')
    expect(insights.topRemainingRow?.category.category_id).toBe('transport')
  })
})
