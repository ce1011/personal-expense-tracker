<script setup lang="ts">
import { formatCurrency } from '@/lib/formatters'
import type { CategoryAlert } from '@/lib/dailyFinance/categoryAlerts'

defineProps<{
  alerts: readonly CategoryAlert[]
  currency: string
}>()

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
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">分類預算警報</h2>
        <p class="mt-1 text-sm text-stone-500">本期各分類支出與目標上限比較</p>
      </div>
    </div>

    <div v-if="alerts.length" class="space-y-4">
      <div
        v-for="alert in alerts"
        :key="alert.category_id"
        class="space-y-2"
      >
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
              {{ formatCurrency(alert.spent, currency) }} / {{ formatCurrency(alert.target, currency) }}
            </span>
          </div>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full transition-all"
            :class="{
              'bg-emerald-600': alert.severity === 'ok',
              'bg-amber-500': alert.severity === 'warning',
              'bg-red-600': alert.severity === 'danger',
            }"
            :style="{ width: `${Math.min(alert.percentage, 100)}%` }"
          />
        </div>

        <p class="text-right text-xs text-stone-500">
          尚餘 {{ formatCurrency(alert.remaining, currency) }} · {{ Math.round(alert.percentage) }}%
        </p>
      </div>
    </div>

    <p v-else class="rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-500">
      目前沒有設定分類支出上限。
    </p>
  </article>
</template>
