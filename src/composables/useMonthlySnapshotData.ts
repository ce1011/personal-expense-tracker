import { computed } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'

/** Monthly-snapshot page: the single aggregate the page renders. */
export function useMonthlySnapshotData() {
  const { data, loading, error, refresh } = usePageData(() => api.monthlySnapshot.get())

  const snapshot = computed(() => data.value?.monthlySnapshot)
  const currency = computed(() => data.value?.currency ?? 'HKD')

  return { snapshot, currency, loading, error, refresh }
}
