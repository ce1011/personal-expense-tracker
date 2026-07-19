import { computed, type ComputedRef } from 'vue'

import { useDashboardData } from '@/composables/useDashboardData'
import type { BudgetCycle } from '@/types/app-data'

/**
 * Shell chrome data (the app header's cycle label).
 *
 * The dashboard aggregate already contains the current cycle. Reuse the
 * dashboard composable's shared request/state so the shell and homepage do not
 * issue duplicate GET /dashboard calls during startup.
 */
export function useShellData(isPublic: ComputedRef<boolean>) {
  const { dashboard, loading, refresh } = useDashboardData({
    enabled: computed(() => !isPublic.value),
  })

  return {
    currentCycle: computed<BudgetCycle | undefined>(() => dashboard.value?.currentCycle),
    loading,
    refresh,
  }
}
