<script setup lang="ts">
import MetricCard from '@/components/common/MetricCard.vue'
import { useAppData } from '@/composables/useAppData'
import { formatCurrency, formatPercent } from '@/lib/formatters'

const appData = useAppData()
const snapshot = appData.monthlySnapshot

function deltaLabel(delta: number): string {
  if (delta > 0) {
    return `多 ${formatCurrency(delta, appData.currency.value)}`
  }

  if (delta < 0) {
    return `少 ${formatCurrency(Math.abs(delta), appData.currency.value)}`
  }

  return '持平'
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">每月快照</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">本期財務總覽</h1>
      <p class="mt-2 text-sm text-stone-600">{{ snapshot.cycleWindow.label }}</p>
    </section>

    <section class="grid gap-3 md:grid-cols-4">
      <MetricCard
        label="收入"
        :value="formatCurrency(snapshot.incomeTotal, appData.currency.value)"
        tone="good"
      />
      <MetricCard
        label="支出"
        :value="formatCurrency(snapshot.expenseTotal, appData.currency.value)"
      />
      <MetricCard
        label="儲蓄"
        :value="formatCurrency(snapshot.savingTotal, appData.currency.value)"
        tone="good"
      />
      <MetricCard label="儲蓄率" :value="formatPercent(snapshot.savingsRate)" tone="good" />
    </section>

    <section class="grid gap-3 lg:grid-cols-2">
      <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 class="text-base font-semibold text-stone-950">本期結餘</h2>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
          {{ formatCurrency(snapshot.remainingBudget, appData.currency.value) }}
        </p>
        <p class="mt-1 text-sm text-stone-500">
          日均支出 {{ formatCurrency(snapshot.dailyAverageSpent, appData.currency.value) }}
        </p>
      </article>

      <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 class="text-base font-semibold text-stone-950">與上週期比較</h2>
        <div v-if="snapshot.vsLastCycle" class="mt-2 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-stone-600">支出變化</span>
            <span
              class="font-semibold"
              :class="{
                'text-red-700': snapshot.vsLastCycle.expenseDelta > 0,
                'text-emerald-700': snapshot.vsLastCycle.expenseDelta < 0,
                'text-stone-600': snapshot.vsLastCycle.expenseDelta === 0,
              }"
            >
              {{ deltaLabel(snapshot.vsLastCycle.expenseDelta) }}
              （{{ Math.round(snapshot.vsLastCycle.expenseDeltaPercent) }}%）
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-stone-600">儲蓄變化</span>
            <span
              class="font-semibold"
              :class="{
                'text-emerald-700': snapshot.vsLastCycle.savingDelta > 0,
                'text-red-700': snapshot.vsLastCycle.savingDelta < 0,
                'text-stone-600': snapshot.vsLastCycle.savingDelta === 0,
              }"
            >
              {{ deltaLabel(snapshot.vsLastCycle.savingDelta) }}
            </span>
          </div>
        </div>
        <p v-else class="mt-2 text-sm text-stone-500">沒有上週期資料可比較</p>
      </article>
    </section>

    <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 class="text-base font-semibold text-stone-950">主要支出分類</h2>

      <div v-if="snapshot.topExpenseCategories.length" class="mt-4 space-y-4">
        <div
          v-for="category in snapshot.topExpenseCategories"
          :key="category.category_id"
          class="space-y-2"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-stone-900">{{ category.name }}</span>
            <span class="text-stone-700">
              {{ formatCurrency(category.amount, appData.currency.value) }} ·
              {{ Math.round(category.percentage) }}%
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              class="h-full rounded-full bg-emerald-600 transition-all"
              :style="{ width: `${Math.min(category.percentage, 100)}%` }"
            />
          </div>
        </div>
      </div>

      <p
        v-else
        class="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-500"
      >
        本期尚未有支出紀錄。
      </p>
    </section>
  </div>
</template>
