<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

export interface RestoreImpactSummary {
  cycles: number
  expenseCategories: number
  incomeCategories: number
  expenses: number
  incomes: number
  targetExpenses: number
  savings: number
  settings: number
  trips: number
  fxRates: number
  savingChallenges: number
  assetAccounts?: number
  accountBalances?: number
}

defineProps<{
  impact?: RestoreImpactSummary
  integrityErrors: readonly string[]
}>()
</script>

<template>
  <BaseCard v-if="impact">
    <h2 class="text-h3 font-semibold text-text">還原影響摘要</h2>
    <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">支出</p>
        <p class="mt-1 text-lg font-bold text-text">{{ impact.expenses }}</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">收入</p>
        <p class="mt-1 text-lg font-bold text-text">{{ impact.incomes }}</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">儲蓄</p>
        <p class="mt-1 text-lg font-bold text-text">{{ impact.savings }}</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">分類</p>
        <p class="mt-1 text-lg font-bold text-text">
          {{ impact.expenseCategories + impact.incomeCategories }}
        </p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">旅程</p>
        <p class="mt-1 text-lg font-bold text-text">{{ impact.trips }}</p>
      </div>
      <div class="rounded-xl bg-accent px-3 py-3 text-sm text-text-2">
        <p class="text-xs text-text-3">預算週期</p>
        <p class="mt-1 text-lg font-bold text-text">{{ impact.cycles }}</p>
      </div>
    </div>

    <div
      v-if="integrityErrors.length"
      class="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
    >
      <p class="font-semibold">完整性檢查未通過</p>
      <ul class="mt-2 list-disc pl-5">
        <li v-for="error in integrityErrors" :key="error">{{ error }}</li>
      </ul>
    </div>
    <p v-else class="mt-4 text-body-sm text-primary">完整性檢查通過，可以安全還原。</p>
  </BaseCard>
</template>
