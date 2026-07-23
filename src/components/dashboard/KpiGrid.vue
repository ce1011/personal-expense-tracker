<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import { formatCurrency } from '@/lib/formatters'

defineProps<{
  todayAvailable: number
  todaySpent: number
  savingTarget: number
  fixedExpenses: number
  currency: string
  isOverToday: boolean
}>()
</script>

<template>
  <div class="kpi-grid grid grid-cols-2 gap-3">
    <BaseCard class="kpi-card">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">今日可用</p>
      <p
        class="money-figure mt-2 text-xl font-bold"
        :class="isOverToday ? 'text-danger' : 'text-primary'"
      >
        {{ formatCurrency(todayAvailable, currency) }}
      </p>
      <p class="mt-1 text-xs text-text-2">今日預算</p>
    </BaseCard>

    <BaseCard class="kpi-card">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">今日已用</p>
      <p class="money-figure mt-2 text-xl font-bold text-text">
        {{ formatCurrency(todaySpent, currency) }}
      </p>
      <p class="mt-1 text-xs text-text-2">今天支出</p>
    </BaseCard>

    <BaseCard class="kpi-card">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">儲蓄目標</p>
      <p class="money-figure mt-2 text-xl font-bold text-text">
        {{ formatCurrency(savingTarget, currency) }}
      </p>
      <p class="mt-1 text-xs text-text-2">本期目標</p>
    </BaseCard>

    <BaseCard class="kpi-card">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">固定支出</p>
      <p class="money-figure mt-2 text-xl font-bold text-text">
        {{ formatCurrency(fixedExpenses, currency) }}
      </p>
      <p class="mt-1 text-xs text-text-2">本期預估</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.kpi-card {
  animation: kpi-arrive 460ms backwards cubic-bezier(0.16, 1, 0.3, 1);
}

.kpi-card:nth-child(2) {
  animation-delay: 55ms;
}

.kpi-card:nth-child(3) {
  animation-delay: 110ms;
}

.kpi-card:nth-child(4) {
  animation-delay: 165ms;
}

@keyframes kpi-arrive {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
</style>
