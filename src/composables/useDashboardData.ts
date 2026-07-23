import type { ComputedRef } from 'vue'
import { computed, readonly, shallowRef, watch } from 'vue'

import { invalidateRequestCache } from '@/api/requestCache'
import { useAppData } from '@/composables/useAppData'
import { getDashboardContext } from '@/services/appDataService'
import type { DashboardData } from '@/api/types'

const dashboard = shallowRef<DashboardData | undefined>(undefined)
const loading = shallowRef(false)
const error = shallowRef('')
let requestVersion = 0

/**
 * Dashboard (homepage) data.
 *
 * The shell also needs the dashboard's current cycle, so this composable keeps
 * one shared state for both consumers. The API request cache collapses
 * concurrent startup reads into one GET /dashboard call.
 */
export function useDashboardData(options: { enabled?: ComputedRef<boolean> } = {}) {
  const appData = useAppData()
  const enabled = options.enabled ?? computed(() => true)

  async function load(force = false): Promise<void> {
    if (force) {
      invalidateRequestCache(['dashboard'])
    }

    const version = ++requestVersion
    loading.value = true
    error.value = ''

    try {
      const nextDashboard = await getDashboardContext()
      if (version === requestVersion) {
        dashboard.value = nextDashboard
        appData.hydrateContext(nextDashboard)
      }
    } catch (caught) {
      if (version === requestVersion) {
        error.value = caught instanceof Error ? caught.message : 'Unable to load dashboard'
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false
      }
    }
  }

  watch(
    enabled,
    (isEnabled) => {
      if (isEnabled) void load()
    },
    { immediate: true },
  )
  watch(appData.mutationVersion('dashboard'), () => {
    if (enabled.value) void load()
  })

  return {
    dashboard: computed(() => dashboard.value),
    isTripMode: computed(() => dashboard.value?.isTripMode ?? false),
    loading: readonly(loading),
    error: readonly(error),
    refresh: () => load(true),
  }
}
