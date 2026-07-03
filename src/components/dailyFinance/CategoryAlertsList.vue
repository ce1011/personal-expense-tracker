<script setup lang="ts">
import { computed } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/lib/formatters'
import type { CategoryAlert } from '@/lib/dailyFinance/categoryAlerts'

const props = defineProps<{
  alerts: readonly CategoryAlert[]
  currency: string
}>()

const visibleAlerts = computed(() => props.alerts.filter((alert) => alert.severity !== 'ok'))

function severityLabel(severity: CategoryAlert['severity']): string {
  switch (severity) {
    case 'ok':
      return '正常'
    case 'warning':
      return '接近上限'
    case 'danger':
      return '已超支'
  }
}

function severityColorClass(severity: CategoryAlert['severity']): string {
  switch (severity) {
    case 'ok':
      return 'bg-emerald-600'
    case 'warning':
      return 'bg-amber-500'
    case 'danger':
      return 'bg-red-600'
  }
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">分類預算警報</h2>
        <p class="mt-1 text-sm text-stone-500">本期各分類支出與目標上限比較</p>
      </div>
    </div>

    <div v-if="visibleAlerts.length" class="space-y-4">
      <div v-for="alert in visibleAlerts" :key="alert.category_id" class="space-y-2">
        <div class="flex items-center justify-between gap-3 text-sm">
          <div class="flex items-center gap-2">
            <span
              class="inline-block size-3 rounded-full"
              :style="{ backgroundColor: `#${alert.color_code}` }"
              aria-hidden="true"
            />
            <span class="font-medium text-stone-900">{{ alert.category_name }}</span>
          </div>
          <div class="flex items-center gap-3 text-right">
            <span
              class="text-xs font-semibold"
              :class="{
                'text-emerald-700': alert.severity === 'ok',
                'text-amber-700': alert.severity === 'warning',
                'text-red-700': alert.severity === 'danger',
              }"
            >
              {{ severityLabel(alert.severity) }}
            </span>
            <span class="text-stone-700">
              {{ formatCurrency(alert.spent, currency) }} /
              {{ formatCurrency(alert.target, currency) }}
            </span>
          </div>
        </div>

        <ProgressBar
          :percentage="alert.percentage"
          :color-class="severityColorClass(alert.severity)"
        />

        <p class="text-right text-xs text-stone-500">
          <template v-if="alert.severity === 'danger'">
            已超支 {{ formatCurrency(Math.abs(alert.remaining), currency) }} ·
            {{ Math.round(alert.percentage) }}%
          </template>
          <template v-else>
            尚餘 {{ formatCurrency(alert.remaining, currency) }} ·
            {{ Math.round(alert.percentage) }}%
          </template>
        </p>
      </div>
    </div>

    <EmptyState
      v-else
      title="目前沒有分類預算警報"
      message="所有分類支出都在健康範圍內，暫時無需特別留意。"
    />
  </article>
</template>
