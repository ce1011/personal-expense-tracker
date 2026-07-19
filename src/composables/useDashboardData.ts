import type { ComputedRef } from 'vue'
import { computed, readonly, shallowRef, watch } from 'vue'

import { api } from '@/api/client'
import { useAppData } from '@/composables/useAppData'
import type { DashboardData } from '@/api/types'

const dashboard = shallowRef<DashboardData | undefined>(undefined)
const loading = shallowRef(false)
const error = shallowRef('')
let request: Promise<void> | null = null

/**
 * Dashboard (homepage) data.
 *
 * The shell also needs the dashboard's current cycle, so this composable keeps
 * one shared request/state for both consumers. Concurrent startup refreshes
 * join the same promise instead of issuing duplicate GET /dashboard calls.
 */
export function useDashboardData(options: { enabled?: ComputedRef<boolean> } = {}) {
  const appData = useAppData()
  const enabled = options.enabled ?? computed(() => true)

  async function refresh(): Promise<void> {
    if (request) return request

    loading.value = true
    error.value = ''
    request = api.dashboard
      .get()
      .then((nextDashboard) => {
        dashboard.value = nextDashboard
      })
      .catch((caught) => {
        error.value = caught instanceof Error ? caught.message : 'Unable to load dashboard'
      })
      .finally(() => {
        loading.value = false
        request = null
      })

    return request
  }

  watch(
    enabled,
    (isEnabled) => {
      if (isEnabled) void refresh()
    },
    { immediate: true },
  )
  watch(appData.mutationVersion('dashboard'), () => {
    if (enabled.value) void refresh()
  })

  return {
    dashboard: computed(() => dashboard.value),
    isTripMode: computed(() => dashboard.value?.isTripMode ?? false),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
