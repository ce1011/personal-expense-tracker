import { computed } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'

/** Trips page: trips, the active trip + budget helper, and per-trip spent totals. */
export function useTripsData() {
  const { data, loading, error, refresh } = usePageData(() => api.tripsSummary.get())

  const trips = computed(() => data.value?.trips ?? [])
  const activeTripId = computed(() => data.value?.activeTripId ?? '')
  const activeTrip = computed(() => data.value?.activeTrip)
  const tripBudgetHelper = computed(() => data.value?.tripBudgetHelper)
  const spentByTrip = computed(() => data.value?.spentByTrip ?? {})
  const currency = computed(() => data.value?.currency ?? 'HKD')

  function spentInTrip(tripId: string): number {
    return spentByTrip.value[tripId] ?? 0
  }

  return {
    trips,
    activeTripId,
    activeTrip,
    tripBudgetHelper,
    spentByTrip,
    spentInTrip,
    currency,
    loading,
    error,
    refresh,
  }
}
