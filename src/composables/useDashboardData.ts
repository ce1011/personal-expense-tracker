import { computed } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'

/**
 * Dashboard (homepage) data.
 *
 * One call — `GET /dashboard` — returns everything the homepage renders, all
 * computed server-side. No client-side derivation or filtering happens here.
 */
export function useDashboardData() {
  const { data, loading, error, refresh } = usePageData(() => api.dashboard.get())

  const dashboard = computed(() => data.value)
  const isTripMode = computed(() => data.value?.isTripMode ?? false)

  return {
    dashboard,
    isTripMode,
    loading,
    error,
    refresh,
  }
}
