import type { CategoryProgressRow } from './categoryProgress'

export interface CategoryBudgetInsights {
  totalTarget: number
  totalSpent: number
  totalRemaining: number
  utilizationRate: number
  overBudgetCount: number
  nearLimitCount: number
  unplannedCount: number
  activeCategories: number
  topSpentRow?: CategoryProgressRow
  topRemainingRow?: CategoryProgressRow
}

export function buildCategoryBudgetInsights(
  rows: readonly CategoryProgressRow[],
): CategoryBudgetInsights {
  const totalTarget = rows.reduce((sum, row) => sum + row.target, 0)
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0)
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0)
  const overBudgetCount = rows.filter((row) => row.spent > row.target && row.target > 0).length
  const nearLimitCount = rows.filter((row) => row.target > 0 && row.ratio >= 0.8 && row.ratio < 1).length
  const unplannedCount = rows.filter((row) => row.target === 0 && row.spent > 0).length
  const activeCategories = rows.filter((row) => row.spent > 0 || row.target > 0).length

  const topSpentRow = [...rows].sort((a, b) => b.spent - a.spent)[0]
  const topRemainingRow = [...rows].sort((a, b) => b.remaining - a.remaining)[0]

  return {
    totalTarget,
    totalSpent,
    totalRemaining,
    utilizationRate: totalTarget > 0 ? Math.min(1, totalSpent / totalTarget) : 0,
    overBudgetCount,
    nearLimitCount,
    unplannedCount,
    activeCategories,
    topSpentRow,
    topRemainingRow,
  }
}
