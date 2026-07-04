<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import { formatCurrency } from '@/lib/formatters'
import type { TripBudgetHelper } from '@/lib/trips'

defineProps<{
  helper?: TripBudgetHelper
  currency: string
}>()
</script>

<template>
  <BaseCard v-if="helper">
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">旅程預算助手</p>
    <h2 class="mt-1 text-base font-semibold text-text">旅程節奏</h2>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-accent px-3 py-3">
        <p class="text-xs text-text-3">剩餘日數</p>
        <p class="mt-1 text-lg font-bold text-text">{{ helper.daysRemaining }} 日</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3">
        <p class="text-xs text-text-3">每日可用</p>
        <p class="mt-1 text-lg font-bold text-text">
          {{ formatCurrency(helper.dailyAllowance, currency) }}
        </p>
      </div>
    </div>
  </BaseCard>
</template>
