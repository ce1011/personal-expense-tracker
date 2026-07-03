<script setup lang="ts">
import { X } from 'lucide-vue-next'

import { formatCurrency, formatDate } from '@/lib/formatters'
import type { WeeklyReview } from '@/lib/dailyFinance/weeklyReview'

defineProps<{
  review: WeeklyReview
  currency: string
}>()

const emit = defineEmits<{
  close: []
}>()

function deltaLabel(delta: number): string {
  if (delta > 0) {
    return `多 ${formatCurrency(delta, 'HKD')}`
  }

  if (delta < 0) {
    return `少 ${formatCurrency(Math.abs(delta), 'HKD')}`
  }

  return '持平'
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 px-4 py-8 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-md bg-[#f9f6ef] p-5 shadow-xl">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-stone-950">上週回顧</h2>
          <p class="mt-1 text-sm text-stone-500">
            {{ formatDate(review.weekStart) }} – {{ formatDate(review.weekEnd) }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-md border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-50"
          @click="emit('close')"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-md border border-stone-200 bg-white p-3">
          <p class="text-xs text-stone-500">支出</p>
          <p class="mt-1 text-lg font-semibold text-stone-950">
            {{ formatCurrency(review.totalSpent, currency) }}
          </p>
        </div>
        <div class="rounded-md border border-stone-200 bg-white p-3">
          <p class="text-xs text-stone-500">收入</p>
          <p class="mt-1 text-lg font-semibold text-stone-950">
            {{ formatCurrency(review.totalIncome, currency) }}
          </p>
        </div>
        <div class="rounded-md border border-stone-200 bg-white p-3">
          <p class="text-xs text-stone-500">儲蓄</p>
          <p class="mt-1 text-lg font-semibold text-stone-950">
            {{ formatCurrency(review.totalSavings, currency) }}
          </p>
        </div>
        <div class="rounded-md border border-stone-200 bg-white p-3">
          <p class="text-xs text-stone-500">交易筆數</p>
          <p class="mt-1 text-lg font-semibold text-stone-950">{{ review.transactionCount }}</p>
        </div>
      </div>

      <div class="mt-4 rounded-md border border-stone-200 bg-white p-3">
        <p class="text-xs text-stone-500">主要支出分類</p>
        <p v-if="review.topCategory" class="mt-1 text-lg font-semibold text-stone-950">
          {{ review.topCategory.name }} · {{ formatCurrency(review.topCategory.amount, currency) }}
        </p>
        <p v-else class="mt-1 text-sm text-stone-500">上週沒有支出紀錄</p>
      </div>

      <div class="mt-4 rounded-md border border-stone-200 bg-white p-3">
        <p class="text-xs text-stone-500">與前一週相比</p>
        <p v-if="review.vsPreviousWeek" class="mt-1 text-lg font-semibold text-stone-950">
          <span
            :class="{
              'text-red-700': review.vsPreviousWeek.spentDelta > 0,
              'text-emerald-700': review.vsPreviousWeek.spentDelta < 0,
              'text-stone-600': review.vsPreviousWeek.spentDelta === 0,
            }"
          >
            {{ deltaLabel(review.vsPreviousWeek.spentDelta) }}
          </span>
          <span class="ml-2 text-sm font-normal text-stone-500"
            >({{ Math.round(review.vsPreviousWeek.spentDeltaPercent) }}%)</span
          >
        </p>
        <p v-else class="mt-1 text-sm text-stone-500">沒有前一週資料可比較</p>
      </div>
    </div>
  </div>
</template>
