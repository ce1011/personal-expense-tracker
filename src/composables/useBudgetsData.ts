import { computed } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'

/** Budgets page: cycles, per-cycle target limits, and editable categories. */
export function useBudgetsData() {
  const { data, loading, error, refresh } = usePageData(() => api.budgets.summary(), {
    scope: 'budgets',
  })

  const cycles = computed(() => data.value?.cycles ?? [])
  const targetExpenses = computed(() => data.value?.targetExpenses ?? [])
  const activeExpenseCategories = computed(() => data.value?.activeExpenseCategories ?? [])
  const currency = computed(() => data.value?.currency ?? 'HKD')

  return { cycles, targetExpenses, activeExpenseCategories, currency, loading, error, refresh }
}
