<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { WeeklyReview } from '@/lib/dailyFinance/weeklyReview'

const props = defineProps<{
  review: WeeklyReview
  currency: string
}>()

const emit = defineEmits<{
  close: []
}>()

function deltaLabel(delta: number): string {
  if (delta > 0) {
    return `多 ${formatCurrency(delta, props.currency)}`
  }

  if (delta < 0) {
    return `少 ${formatCurrency(Math.abs(delta), props.currency)}`
  }

  return '持平'
}
</script>

<template>
  <BaseModal
    :show="true"
    title="上週回顧"
    :subtitle="`${formatDate(review.weekStart)} – ${formatDate(review.weekEnd)}`"
    @close="emit('close')"
  >
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
  </BaseModal>
</template>
