import { computed, shallowRef, watch, type ComputedRef } from 'vue'

import { api } from '@/api/client'
import { useAppData } from '@/composables/useAppData'
import type { BudgetCycle } from '@/types/app-data'

/**
 * Shell chrome data (the app header's cycle label).
 *
 * The header only needs the current budget cycle for its label; everything
 * else it renders (trips, active trip) comes from the shared `useAppData`
 * context. This fetches the cycle from the dashboard aggregate, but only when
 * the current route is private — public (auth) routes render no shell.
 */
export function useShellData(isPublic: ComputedRef<boolean>) {
  const appData = useAppData()
  const currentCycle = shallowRef<BudgetCycle | undefined>(undefined)
  const loading = shallowRef(false)

  async function refresh(): Promise<void> {
    if (isPublic.value) {
      currentCycle.value = undefined
      loading.value = false
      return
    }

    loading.value = true

    try {
      const dashboard = await api.dashboard.get()
      currentCycle.value = dashboard.currentCycle
    } catch {
      currentCycle.value = undefined
    } finally {
      loading.value = false
    }
  }

  // Load once the route becomes private, and re-fetch after any mutation.
  watch(isPublic, () => void refresh(), { immediate: true })
  watch(appData.contextVersion, () => void refresh())

  return {
    currentCycle: computed(() => currentCycle.value),
    loading: computed(() => loading.value),
    refresh,
  }
}
