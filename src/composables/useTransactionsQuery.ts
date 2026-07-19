import { computed, reactive, readonly, shallowRef, watch } from 'vue'

import { api } from '@/api/client'
import type { TransactionsQueryParams } from '@/api/types'
import { useAppData } from '@/composables/useAppData'

export interface TransactionsFilterState {
  tripId: string
  kind: 'all' | 'expense' | 'income' | 'saving'
  categoryId: string
  datePreset: 'all' | 'today' | 'cycle' | 'future'
  search: string
}

const DEBOUNCE_MS = 250

/**
 * Transactions page data — the server runs the query.
 *
 * The page holds only the filter state; every change is sent to
 * `GET /transactions` (debounced for the search box) and the backend returns
 * the filtered, date-grouped result plus the filter option lists. No
 * client-side filtering or grouping happens here.
 */
export function useTransactionsQuery() {
  const appData = useAppData()

  const filters = reactive<TransactionsFilterState>({
    tripId: 'all',
    kind: 'all',
    categoryId: 'all',
    datePreset: 'all',
    search: '',
  })

  const result = shallowRef<Awaited<ReturnType<typeof api.transactionsQuery.list>> | undefined>(
    undefined,
  )
  const loading = shallowRef(false)
  const error = shallowRef('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const groups = computed(() => result.value?.groups ?? [])
  const options = computed(() => result.value?.options)
  const currency = computed(() => result.value?.currency ?? appData.currency.value)
  const expenseCategories = computed(() => result.value?.expenseCategories ?? [])
  const incomeCategories = computed(() => result.value?.incomeCategories ?? [])
  const activeExpenseCategories = computed(() => options.value?.expenseCategories ?? [])
  const activeIncomeCategories = computed(() => options.value?.incomeCategories ?? [])
  const savingCategoryOptions = computed(() => options.value?.savingCategories ?? [])
  const savingChallenges = computed(() => result.value?.savingChallenges ?? [])
  const trips = computed(() => options.value?.trips ?? [])
  const fxRateMap = computed(() => appData.fxRateMap.value)
  const latestFxDate = computed(() => result.value?.latestFxDate ?? appData.latestFxDate.value)

  function toQuery(): TransactionsQueryParams {
    return {
      q: filters.search.trim() || undefined,
      kind: filters.kind,
      category_id: filters.categoryId,
      trip_id: filters.tripId,
      date_preset: filters.datePreset,
    }
  }

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      result.value = await api.transactionsQuery.list(toQuery())
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load transactions'
    } finally {
      loading.value = false
    }
  }

  function scheduleRefresh(): void {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void refresh()
    }, DEBOUNCE_MS)
  }

  // Re-query on any filter change (search is debounced; selects feel instant
  // enough through the same short debounce).
  watch(
    () => [filters.tripId, filters.kind, filters.categoryId, filters.datePreset, filters.search],
    scheduleRefresh,
    { immediate: true },
  )

  // Re-query when a mutation completes elsewhere (add/edit/delete transaction).
  watch(appData.contextVersion, scheduleRefresh)

  // Keep the trip filter aligned with the global trip-mode selection.
  watch(
    appData.activeTripId,
    (activeTripId) => {
      filters.tripId = activeTripId || 'all'
    },
    { immediate: true },
  )

  // If the selected trip disappears (deleted elsewhere), fall back sensibly.
  watch(trips, (tripList) => {
    if (filters.tripId === 'all' || filters.tripId === 'unassigned') {
      return
    }

    if (!tripList.some((trip) => trip.trip_id === filters.tripId)) {
      filters.tripId = appData.activeTripId.value || 'all'
    }
  })

  // Resetting the kind clears the category (a category belongs to one kind).
  watch(
    () => filters.kind,
    () => {
      filters.categoryId = 'all'
    },
  )

  function resetFilters(): void {
    filters.tripId = appData.activeTripId.value || 'all'
    filters.kind = 'all'
    filters.categoryId = 'all'
    filters.datePreset = 'all'
    filters.search = ''
  }

  return {
    filters,
    groups,
    options,
    currency,
    expenseCategories,
    incomeCategories,
    activeExpenseCategories,
    activeIncomeCategories,
    savingCategoryOptions,
    savingChallenges,
    trips,
    fxRateMap,
    latestFxDate,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
    resetFilters,
  }
}
