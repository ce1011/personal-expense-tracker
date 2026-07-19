import { onMounted, readonly, shallowRef, watch } from 'vue'

import { useAppData } from '@/composables/useAppData'

/**
 * Generic per-page data loader.
 *
 * Each page calls its own aggregate endpoint through `loader`. The result is
 * exposed as a read-only ref plus `loading`/`error`. The page data refreshes:
 *
 * - once on mount (when `immediate` is true), and
 * - whenever the shared `useAppData` mutation layer bumps `contextVersion`
 *   (i.e. after any add/update/delete anywhere in the app), so an open page
 *   always reflects the latest server state without re-fetching on focus.
 */
export function usePageData<T>(loader: () => Promise<T>, options: { immediate?: boolean } = {}) {
  const appData = useAppData()
  const data = shallowRef<T | undefined>(undefined)
  const loading = shallowRef(false)
  const error = shallowRef('')

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      data.value = await loader()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load data'
    } finally {
      loading.value = false
    }
  }

  if (options.immediate ?? true) {
    onMounted(() => {
      void refresh()
    })
  }

  // Re-fetch this page's aggregate whenever any mutation completes elsewhere.
  watch(appData.contextVersion, () => {
    void refresh()
  })

  return {
    data,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
