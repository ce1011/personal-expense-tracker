import { computed, shallowRef } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'
import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import {
  buildHistoryReview,
  type HistoryRangePreset,
  type HistoryReviewReport,
} from '@/lib/historyReview'

export type HistoryCustomRange = {
  start: string
  end: string
}

function defaultCustomRange(now = new Date()): HistoryCustomRange {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return {
    start: toDateInputValue(start.getTime()),
    end: toDateInputValue(now.getTime()),
  }
}

export function useHistoryReviewData() {
  const { data, loading, error, refresh } = usePageData(() => api.historyReview.get(), {
    scope: 'historyReview',
  })
  const range = shallowRef<HistoryRangePreset>('6m')
  const customRange = shallowRef<HistoryCustomRange>(defaultCustomRange())

  function selectRange(next: HistoryRangePreset): void {
    range.value = next
    if (next === 'custom' && (!customRange.value.start || !customRange.value.end)) {
      customRange.value = defaultCustomRange()
    }
  }

  const report = computed<HistoryReviewReport | undefined>(() => {
    if (!data.value) {
      return undefined
    }

    const custom =
      range.value === 'custom' && customRange.value.start && customRange.value.end
        ? {
            start: fromDateInputValue(customRange.value.start),
            end: fromDateInputValue(customRange.value.end),
          }
        : undefined

    return buildHistoryReview({
      expenses: data.value.expenses,
      incomes: data.value.incomes,
      savings: data.value.savings,
      categories: data.value.categories,
      cycles: data.value.cycles,
      targets: data.value.targets,
      accounts: data.value.accounts,
      balances: data.value.balances,
      range: range.value,
      customRange: custom,
    })
  })

  const currency = computed(() => data.value?.currency ?? 'HKD')
  const accounts = computed(() => data.value?.accounts ?? [])
  const balances = computed(() => data.value?.balances ?? [])

  return {
    report,
    currency,
    accounts,
    balances,
    range,
    customRange,
    selectRange,
    loading,
    error,
    refresh,
  }
}
