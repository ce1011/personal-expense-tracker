import { computed, reactive, readonly, shallowRef, watch } from 'vue'

import { api } from '@/api/client'
import type { TransactionsQueryParams } from '@/api/types'
import { useAppData } from '@/composables/useAppData'
import { fromDateInputValue, startOfLocalDay } from '@/lib/date'

export interface TransactionsFilterState {
  tripId: string
  kind: 'all' | 'expense' | 'income' | 'saving'
  categoryId: string
  datePreset: 'all' | 'today' | 'cycle' | 'previous' | 'future' | 'custom'
  fromDate: string
  toDate: string
  search: string
}

const DAY_MS = 86_400_000
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
    fromDate: '',
    toDate: '',
    search: '',
  })

  const result = shallowRef<Awaited<ReturnType<typeof api.transactionsQuery.list>> | undefined>(
    undefined,
  )
  const loading = shallowRef(false)
  const error = shallowRef('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let requestVersion = 0

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

  function todayWindow(): { start: number; end: number } {
    const now = new Date()
    const start = startOfLocalDay(now)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
    return { start, end }
  }

  function toQuery(): TransactionsQueryParams {
    const params: TransactionsQueryParams = {
      q: filters.search.trim() || undefined,
      kind: filters.kind,
      category_id: filters.categoryId,
      trip_id: filters.tripId,
      date_preset: filters.datePreset,
    }

    if (filters.datePreset === 'today') {
      const window = todayWindow()
      params.from_date = String(window.start)
      params.to_date = String(window.end)
    } else if (filters.datePreset === 'future') {
      params.from_date = String(todayWindow().end)
    } else if (filters.datePreset === 'custom') {
      params.from_date = filters.fromDate ? String(fromDateInputValue(filters.fromDate)) : undefined
      params.to_date = filters.toDate
        ? String(fromDateInputValue(filters.toDate) + DAY_MS)
        : undefined
    }

    return params
  }

  async function refresh(): Promise<void> {
    const version = ++requestVersion
    loading.value = true
    error.value = ''

    try {
      const nextResult = await api.transactionsQuery.list(toQuery())
      if (version === requestVersion) {
        result.value = nextResult
      }
    } catch (caught) {
      if (version === requestVersion) {
        error.value = caught instanceof Error ? caught.message : 'Unable to load transactions'
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false
      }
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
    () => [
      filters.tripId,
      filters.kind,
      filters.categoryId,
      filters.datePreset,
      filters.fromDate,
      filters.toDate,
      filters.search,
    ],
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

  // A manually entered range is a date filter in its own right.
  watch(
    () => [filters.fromDate, filters.toDate],
    ([fromDate, toDate]) => {
      if (fromDate || toDate) {
        filters.datePreset = 'custom'
      } else if (filters.datePreset === 'custom') {
        filters.datePreset = 'all'
      }
    },
  )

  function setDatePreset(value: TransactionsFilterState['datePreset']): void {
    filters.fromDate = ''
    filters.toDate = ''
    filters.datePreset = value
  }

  function resetFilters(): void {
    filters.tripId = appData.activeTripId.value || 'all'
    filters.kind = 'all'
    filters.categoryId = 'all'
    filters.fromDate = ''
    filters.toDate = ''
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
    setDatePreset,
  }
}
