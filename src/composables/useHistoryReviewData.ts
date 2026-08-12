import { computed, shallowRef } from 'vue'

import { api } from '@/api/client'
import { usePageData } from '@/composables/usePageData'
import {
  buildHistoryReview,
  type HistoryRangePreset,
  type HistoryReviewReport,
} from '@/lib/historyReview'

export function useHistoryReviewData() {
  const { data, loading, error, refresh } = usePageData(() => api.historyReview.get(), {
    scope: 'historyReview',
  })
  const range = shallowRef<HistoryRangePreset>('6m')

  const report = computed<HistoryReviewReport | undefined>(() => {
    if (!data.value) {
      return undefined
    }

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
    })
  })

  const currency = computed(() => data.value?.currency ?? 'HKD')
  const accounts = computed(() => data.value?.accounts ?? [])
  const balances = computed(() => data.value?.balances ?? [])

  return { report, currency, accounts, balances, range, loading, error, refresh }
}
