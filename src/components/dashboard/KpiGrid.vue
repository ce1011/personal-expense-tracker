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
  <div class="grid grid-cols-2 gap-3">
    <BaseCard>
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">今日可用</p>
      <p class="mt-2 text-xl font-bold" :class="isOverToday ? 'text-danger' : 'text-primary'">
        {{ formatCurrency(todayAvailable, currency) }}
      </p>
      <p class="mt-1 text-xs text-text-2">今日預算</p>
    </BaseCard>

    <BaseCard>
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">今日已用</p>
      <p class="mt-2 text-xl font-bold text-text">{{ formatCurrency(todaySpent, currency) }}</p>
      <p class="mt-1 text-xs text-text-2">今天支出</p>
    </BaseCard>

    <BaseCard>
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">儲蓄目標</p>
      <p class="mt-2 text-xl font-bold text-text">{{ formatCurrency(savingTarget, currency) }}</p>
      <p class="mt-1 text-xs text-text-2">本期目標</p>
    </BaseCard>

    <BaseCard>
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">固定支出</p>
      <p class="mt-2 text-xl font-bold text-text">{{ formatCurrency(fixedExpenses, currency) }}</p>
      <p class="mt-1 text-xs text-text-2">本期預估</p>
    </BaseCard>
  </div>
</template>
