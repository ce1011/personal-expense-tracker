import { onMounted, readonly, shallowRef, watch } from 'vue'

import { clearRequestCache, invalidateRequestCache } from '@/api/requestCache'
import { useAppData, type AppDataScope } from '@/composables/useAppData'

/**
 * Generic per-page data loader.
 *
 * Each page calls its own aggregate endpoint through `loader`. The result is
 * exposed as a read-only ref plus `loading`/`error`. The page data refreshes:
 *
 * - once on mount (when `immediate` is true), and
 * - whenever the shared mutation layer bumps this page's scope.
 *
 * Initial navigation may reuse a short-lived aggregate from the request cache.
 * Explicit `refresh()` bypasses that entry, while mutations invalidate the
 * relevant scope before this watcher runs.
 */
export function usePageData<T>(
  loader: () => Promise<T>,
  options: { immediate?: boolean; scope?: AppDataScope } = {},
) {
  const appData = useAppData()
  const data = shallowRef<T | undefined>(undefined)
  const loading = shallowRef(false)
  const error = shallowRef('')
  let requestVersion = 0

  async function load(force = false): Promise<void> {
    if (force) {
      if (options.scope) {
        invalidateRequestCache([options.scope])
      } else {
        clearRequestCache()
      }
    }

    const version = ++requestVersion
    loading.value = true
    error.value = ''

    try {
      const nextData = await loader()
      if (version === requestVersion) {
        data.value = nextData
      }
    } catch (caught) {
      if (version === requestVersion) {
        error.value = caught instanceof Error ? caught.message : 'Unable to load data'
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false
      }
    }
  }

  if (options.immediate ?? true) {
    onMounted(() => {
      void load()
    })
  }

  // Re-fetch only for mutations that can affect this aggregate. Consumers that
  // omit a scope retain the old broad invalidation behavior for compatibility.
  const invalidation = options.scope
    ? appData.mutationVersion(options.scope)
    : appData.contextVersion
  watch(invalidation, () => {
    void load()
  })

  return {
    data,
    loading: readonly(loading),
    error: readonly(error),
    refresh: () => load(true),
  }
}
