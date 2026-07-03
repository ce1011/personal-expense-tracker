<script setup lang="ts">
import { computed } from 'vue'

import { withHash, formatCurrency } from '@/lib/formatters'
import type { CategoryProgressRow } from '@/lib/categoryProgress'

const props = defineProps<{
  row: CategoryProgressRow
  currency: string
}>()

const tone = computed(() => {
  if (props.row.target > 0 && props.row.spent > props.row.target) return 'danger'
  if (props.row.target > 0 && props.row.ratio >= 0.8) return 'warning'
  return 'good'
})

const status = computed(() => {
  if (props.row.target === 0 && props.row.spent > 0) return '未設上限'
  if (props.row.target > 0 && props.row.spent > props.row.target) return '超支'
  if (props.row.target > 0 && props.row.ratio >= 0.8) return '接近上限'
  return '健康'
})

const progressPercentage = computed(() =>
  props.row.target > 0 ? props.row.ratio * 100 : props.row.spent > 0 ? 100 : 0,
)
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-3">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="size-3 rounded-full"
          :style="{ backgroundColor: withHash(row.category.color_code) }"
        />
        <div class="min-w-0">
          <p class="truncate text-body-sm font-semibold text-text">
            {{ row.category.name_tc || row.category.name_en }}
          </p>
          <p class="mt-0.5 text-caption text-text-2">
            已用 {{ formatCurrency(row.spent, currency) }} · 上限
            {{ row.target > 0 ? formatCurrency(row.target, currency) : '未設定' }} · 餘額
            {{ formatCurrency(row.remaining, currency) }}
          </p>
        </div>
      </div>
      <span
        class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="{
          'bg-danger/10 text-danger': tone === 'danger',
          'bg-warning/10 text-warning': tone === 'warning',
          'bg-success/10 text-success': tone === 'good',
        }"
      >
        {{ status }}
      </span>
    </div>

    <div
      class="mt-3 h-3 w-full overflow-hidden rounded-full bg-border"
      role="progressbar"
      :aria-valuenow="Math.min(progressPercentage, 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-3 rounded-full transition-all"
        :style="{
          width: `${Math.min(progressPercentage, 100)}%`,
          backgroundColor: withHash(row.category.color_code),
        }"
      />
    </div>
  </div>
</template>
