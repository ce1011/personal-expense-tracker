<script setup lang="ts">
import { computed } from 'vue'
import { History } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/lib/formatters'

const props = defineProps<{
  remainingBudget: number
  incomeTotal: number
  expenseTotal: number
  currency: string
  cycleLabel?: string
}>()

const emit = defineEmits<{
  weeklyReview: []
}>()

const spendingPercentage = computed(() =>
  props.incomeTotal > 0 ? (props.expenseTotal / props.incomeTotal) * 100 : 0,
)
const isOverBudget = computed(() => props.remainingBudget < 0)
</script>

<template>
  <BaseCard variant="primary" class="relative">
    <button
      type="button"
      class="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full text-primary-2 transition hover:bg-primary/10"
      aria-label="上週回顧"
      @click="emit('weeklyReview')"
    >
      <History class="size-5" aria-hidden="true" />
    </button>

    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-2">本期結餘</p>
    <p
      class="mt-2 text-3xl font-bold tracking-tight"
      :class="isOverBudget ? 'text-danger' : 'text-text'"
    >
      {{ formatCurrency(remainingBudget, currency) }}
    </p>
    <p class="mt-1 text-sm text-text-2">
      收入 {{ formatCurrency(incomeTotal, currency) }} − 支出
      {{ formatCurrency(expenseTotal, currency) }}
    </p>
    <p v-if="cycleLabel" class="mt-1 text-xs text-text-3">{{ cycleLabel }}</p>

    <div class="mt-4">
      <ProgressBar
        :percentage="spendingPercentage"
        color-class="bg-primary"
        size="md"
        :label="`支出佔收入 ${Math.round(spendingPercentage)}%`"
      />
    </div>
  </BaseCard>
</template>
