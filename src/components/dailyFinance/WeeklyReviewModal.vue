<script setup lang="ts">
import { TrendingDown, TrendingUp } from 'lucide-vue-next'

import UiBottomSheet from '@/components/ui/UiBottomSheet.vue'
import BaseCard from '@/components/base/BaseCard.vue'
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

function close(): void {
  emit('close')
}
</script>

<template>
  <UiBottomSheet
    title="上週回顧"
    :subtitle="`${formatDate(review.weekStart)} – ${formatDate(review.weekEnd)}`"
    show
    @close="close"
  >
    <div class="grid grid-cols-2 gap-3">
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">支出</p>
        <p class="mt-2 text-amount font-bold text-danger">
          {{ formatCurrency(review.totalSpent, currency) }}
        </p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">收入</p>
        <p class="mt-2 text-amount font-bold text-primary">
          {{ formatCurrency(review.totalIncome, currency) }}
        </p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">儲蓄</p>
        <p class="mt-2 text-amount font-bold text-primary">
          {{ formatCurrency(review.totalSavings, currency) }}
        </p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">交易筆數</p>
        <p class="mt-2 text-amount font-bold text-text">{{ review.transactionCount }}</p>
      </BaseCard>
    </div>

    <BaseCard class="mt-4">
      <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">主要支出分類</p>
      <p v-if="review.topCategory" class="mt-2 text-body-sm font-semibold text-text">
        {{ review.topCategory.name }} · {{ formatCurrency(review.topCategory.amount, currency) }}
      </p>
      <p v-else class="mt-2 text-body-sm text-text-2">上週沒有支出紀錄</p>
    </BaseCard>

    <BaseCard class="mt-3">
      <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">與前一週相比</p>
      <div v-if="review.vsPreviousWeek" class="mt-2 flex items-center gap-2">
        <TrendingUp
          v-if="review.vsPreviousWeek.spentDelta > 0"
          class="size-5 text-danger"
          aria-hidden="true"
        />
        <TrendingDown
          v-else-if="review.vsPreviousWeek.spentDelta < 0"
          class="size-5 text-primary"
          aria-hidden="true"
        />
        <span
          class="text-body-sm font-semibold"
          :class="{
            'text-danger': review.vsPreviousWeek.spentDelta > 0,
            'text-primary': review.vsPreviousWeek.spentDelta < 0,
            'text-text-2': review.vsPreviousWeek.spentDelta === 0,
          }"
        >
          {{ deltaLabel(review.vsPreviousWeek.spentDelta) }}
        </span>
        <span class="text-caption text-text-2">
          （{{ Math.round(review.vsPreviousWeek.spentDeltaPercent) }}%）
        </span>
      </div>
      <p v-else class="mt-2 text-body-sm text-text-2">沒有前一週資料可比較</p>
    </BaseCard>
  </UiBottomSheet>
</template>
