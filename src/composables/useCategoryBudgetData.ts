import { computed, shallowRef } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'
import { buildCategoryBudgetInsights, getDailyRemainingBudget } from '@/lib/categoryBudgetInsights'
import { buildCategoryProgressRows } from '@/lib/categoryProgress'

/**
 * Category-budget page.
 *
 * The backend returns the raw cycle-scoped inputs (cycle window, cycle/today
 * expenses, target limits, categories). The "today vs cycle" toggle is a pure
 * presentation concern, so the progress-row derivation stays client-side on
 * top of those server-provided inputs.
 */
export function useCategoryBudgetData() {
  const { data, loading, error, refresh } = usePageData(() => api.categoryBudget.summary())

  const budgetProgressMode = shallowRef<'today' | 'cycle'>('today')

  const currency = computed(() => data.value?.currency ?? 'HKD')
  const currentCycle = computed(() => data.value?.currentCycle)
  const activeExpenseCategories = computed(() => data.value?.activeExpenseCategories ?? [])
  const targetExpenses = computed(() => data.value?.targetExpenses ?? [])
  const cycleExpenses = computed(() => data.value?.cycleExpenses ?? [])
  const todayExpenses = computed(() => data.value?.todayExpenses ?? [])
  const remainingCycleDays = computed(() => Math.max(1, data.value?.remainingCycleDays ?? 1))
  const futureCycleDays = computed(() => Math.max(1, remainingCycleDays.value - 1))

  const cycleProgressRows = computed(() =>
    buildCategoryProgressRows(
      activeExpenseCategories.value,
      cycleExpenses.value,
      targetExpenses.value,
      currentCycle.value?.cycle_id,
    ),
  )

  const cycleInsights = computed(() => buildCategoryBudgetInsights(cycleProgressRows.value))

  const dailyRemainingBudget = computed(() =>
    getDailyRemainingBudget(cycleInsights.value.totalRemaining, futureCycleDays.value),
  )

  const progressRows = computed(() => {
    const expenses =
      budgetProgressMode.value === 'today' ? todayExpenses.value : cycleExpenses.value
    const targetDivisor = budgetProgressMode.value === 'today' ? remainingCycleDays.value : 1

    return buildCategoryProgressRows(
      activeExpenseCategories.value,
      expenses,
      targetExpenses.value,
      currentCycle.value?.cycle_id,
      targetDivisor,
      cycleExpenses.value,
      budgetProgressMode.value === 'today',
    )
  })

  const insights = computed(() => {
    const rowInsights = buildCategoryBudgetInsights(progressRows.value)

    if (budgetProgressMode.value === 'cycle') {
      return rowInsights
    }

    const dailyTarget = Math.max(0, dailyRemainingBudget.value)

    return {
      ...rowInsights,
      totalTarget: dailyTarget,
      totalRemaining: dailyTarget - rowInsights.totalSpent,
      utilizationRate: dailyTarget > 0 ? Math.min(1, rowInsights.totalSpent / dailyTarget) : 0,
    }
  })

  const budgetTargetDescription = computed(() =>
    budgetProgressMode.value === 'today'
      ? `本期餘額平均分配至未來 ${futureCycleDays.value} 日`
      : '所有分類上限合計',
  )

  const rankedRows = computed(() => [...progressRows.value].sort((a, b) => b.spent - a.spent))

  const totalSpent = computed(() => rankedRows.value.reduce((sum, row) => sum + row.spent, 0))

  const spendingShareRows = computed(() =>
    rankedRows.value
      .filter((row) => row.spent > 0)
      .map((row) => ({
        ...row,
        share: totalSpent.value > 0 ? row.spent / totalSpent.value : 0,
      })),
  )

  const riskRows = computed(() =>
    rankedRows.value.filter(
      (row) => row.spent > row.target || (row.target > 0 && row.ratio >= 0.8),
    ),
  )

  return {
    budgetProgressMode,
    currency,
    insights,
    budgetTargetDescription,
    rankedRows,
    spendingShareRows,
    riskRows,
    loading,
    error,
    refresh,
  }
}
