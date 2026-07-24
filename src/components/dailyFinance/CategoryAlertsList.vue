<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import UiProgress from '@/components/ui/UiProgress.vue'
import { formatCurrency } from '@/lib/formatters'
import type { CategoryAlert } from '@/lib/dailyFinance/categoryAlerts'
import { AlertTriangle } from 'lucide-vue-next'

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
      return 'bg-primary'
    case 'warning':
      return 'bg-warning'
    case 'danger':
      return 'bg-danger'
  }
}

function severityTextClass(severity: CategoryAlert['severity']): string {
  switch (severity) {
    case 'ok':
      return 'text-primary'
    case 'warning':
      return 'text-warning'
    case 'danger':
      return 'text-danger'
  }
}
</script>

<template>
  <BaseCard>
    <div class="mb-4">
      <h2 class="text-base font-semibold text-text">分類預算警報</h2>
      <p class="mt-1 text-sm text-text-2">只顯示需要留意的分類預算</p>
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
            <span class="font-medium text-text">{{ alert.category_name }}</span>
          </div>
          <div class="flex items-center gap-3 text-right">
            <span class="text-xs font-semibold" :class="severityTextClass(alert.severity)">
              {{ severityLabel(alert.severity) }}
            </span>
            <span class="text-text-2">
              {{ formatCurrency(alert.spent, currency) }} /
              {{ formatCurrency(alert.target, currency) }}
            </span>
          </div>
        </div>

        <UiProgress
          :percentage="alert.percentage"
          :color-class="severityColorClass(alert.severity)"
        />

        <p class="text-right text-xs text-text-2">
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
      :icon="AlertTriangle"
      title="目前沒有分類預算警報"
      message="所有分類支出都在健康範圍內，暫時無需特別留意。"
    />
  </BaseCard>
</template>
