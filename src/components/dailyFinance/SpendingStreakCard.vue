<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import type { SpendingStreak } from '@/lib/dailyFinance/spendingStreak'

defineProps<{
  streak: SpendingStreak
}>()
</script>

<template>
  <BaseCard>
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">消費節奏</p>
    <h2 class="mt-1 text-base font-semibold text-text">No-spend / low-spend streak</h2>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-accent px-3 py-3">
        <p class="text-xs text-text-3">目前 no-spend</p>
        <p class="mt-1 text-lg font-bold text-text">{{ streak.currentNoSpendDays }} 日</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3">
        <p class="text-xs text-text-3">目前 low-spend</p>
        <p class="mt-1 text-lg font-bold text-text">{{ streak.currentLowSpendDays }} 日</p>
      </div>
    </div>
  </BaseCard>
</template>
