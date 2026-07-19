import { computed } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'

/** Fixed-expenses page: recurring expenses, cycle fixed total, and upcoming bills. */
export function useFixedExpensesData() {
  const { data, loading, error, refresh } = usePageData(() => api.fixedExpenses.summary())

  const fixedExpenses = computed(() => data.value?.fixedExpenses ?? [])
  const cycleFixedExpensesTotal = computed(() => data.value?.cycleFixedExpensesTotal ?? 0)
  const upcomingBills = computed(() => data.value?.upcomingBills ?? [])
  const activeExpenseCategories = computed(() => data.value?.activeExpenseCategories ?? [])
  const currency = computed(() => data.value?.currency ?? 'HKD')

  const averageAmount = computed(() => {
    if (fixedExpenses.value.length === 0) {
      return 0
    }

    return (
      fixedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0) /
      fixedExpenses.value.length
    )
  })

  return {
    fixedExpenses,
    cycleFixedExpensesTotal,
    upcomingBills,
    activeExpenseCategories,
    currency,
    averageAmount,
    loading,
    error,
    refresh,
  }
}
