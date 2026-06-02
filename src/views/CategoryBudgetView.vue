<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import { useAppData } from '@/composables/useAppData'
import { buildCategoryBudgetInsights } from '@/lib/categoryBudgetInsights'
import { buildCategoryProgressRows } from '@/lib/categoryProgress'
import { startOfLocalDay } from '@/lib/date'
import { formatCurrency, formatPercent, withHash } from '@/lib/formatters'

const appData = useAppData()
const budgetProgressMode = shallowRef<'today' | 'cycle'>('today')

const todayExpenses = computed(() => {
  const start = startOfLocalDay(new Date())
  const end = start + 86_400_000
  return appData.data.value.expenses.filter((expense) => expense.date >= start && expense.date < end)
})

const cycleDays = computed(() => {
  const window = appData.currentWindow.value

  if (!window) {
    return 1
  }

  return Math.max(1, Math.round((window.end - window.start) / 86_400_000))
})

const progressRows = computed(() => {
  const expenses =
    budgetProgressMode.value === 'today' ? todayExpenses.value : appData.cycleExpenses.value
  const targetDivisor = budgetProgressMode.value === 'today' ? cycleDays.value : 1

  return buildCategoryProgressRows(
    appData.activeExpenseCategories.value,
    expenses,
    appData.data.value.targetExpenses,
    appData.currentCycle.value?.cycle_id,
    targetDivisor,
    appData.cycleExpenses.value,
    budgetProgressMode.value === 'today',
  )
})

const insights = computed(() => buildCategoryBudgetInsights(progressRows.value))

const rankedRows = computed(() => [...progressRows.value].sort((a, b) => b.spent - a.spent))

const totalSpent = computed(() =>
  rankedRows.value.reduce((sum, row) => sum + row.spent, 0),
)

const spendingShareRows = computed(() =>
  rankedRows.value
    .filter((row) => row.spent > 0)
    .map((row) => ({
      ...row,
      share: totalSpent.value > 0 ? row.spent / totalSpent.value : 0,
    })),
)

const riskRows = computed(() =>
  rankedRows.value.filter((row) => row.spent > row.target || (row.target > 0 && row.ratio >= 0.8)),
)

function rowTone(row: (typeof rankedRows.value)[number]): 'text-red-700' | 'text-amber-700' | 'text-emerald-700' {
  if (row.target > 0 && row.spent > row.target) {
    return 'text-red-700'
  }

  if (row.target > 0 && row.ratio >= 0.8) {
    return 'text-amber-700'
  }

  return 'text-emerald-700'
}

function rowStatus(row: (typeof rankedRows.value)[number]): string {
  if (row.target === 0 && row.spent > 0) {
    return '未設上限'
  }

  if (row.target > 0 && row.spent > row.target) {
    return '超支'
  }

  if (row.target > 0 && row.ratio >= 0.8) {
    return '接近上限'
  }

  return '健康'
}
</script>

<template>
  <div class="grid gap-6">
    <section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">分類預算</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">分類預算進度</h1>
        <p class="mt-2 max-w-3xl text-sm text-stone-600">
          用分類角度看清楚本期預算健康、今日可用空間、支出集中位置，以及哪些分類開始失速。
        </p>
      </div>

      <div class="inline-flex rounded-md border border-stone-200 bg-stone-50 p-1">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition"
          :class="budgetProgressMode === 'today' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'"
          @click="budgetProgressMode = 'today'"
        >
          今日
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition"
          :class="budgetProgressMode === 'cycle' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'"
          @click="budgetProgressMode = 'cycle'"
        >
          本期
        </button>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-4">
      <MetricCard
        label="預算上限"
        :value="formatCurrency(insights.totalTarget, appData.currency.value)"
        :detail="budgetProgressMode === 'today' ? '以每日剩餘預算上限計算' : '所有分類上限合計'"
      />
      <MetricCard
        label="已使用"
        :value="formatCurrency(insights.totalSpent, appData.currency.value)"
        :detail="`${insights.activeCategories} 個分類有預算或支出活動`"
        :tone="insights.utilizationRate >= 1 ? 'warn' : 'neutral'"
      />
      <MetricCard
        label="進度餘額"
        :value="formatCurrency(insights.totalRemaining, appData.currency.value)"
        :detail="`${insights.overBudgetCount} 個超支，${insights.nearLimitCount} 個接近上限`"
        :tone="insights.totalRemaining > 0 ? 'good' : 'warn'"
      />
      <MetricCard
        label="使用率"
        :value="formatPercent(insights.utilizationRate)"
        :detail="`${insights.unplannedCount} 個分類未設上限但已有支出`"
        :tone="insights.utilizationRate >= 1 ? 'warn' : 'good'"
      />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">分類比較</h2>
            <p class="text-sm text-stone-500">
              {{ budgetProgressMode === 'today' ? '今日支出對比每日剩餘上限。' : '本期支出對比分類總上限。' }}
            </p>
          </div>
        </div>

        <div v-if="rankedRows.length" class="mt-4 grid gap-4">
          <div v-for="row in rankedRows" :key="row.category.category_id">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <span class="size-3 rounded-full" :style="{ backgroundColor: withHash(row.category.color_code) }" />
                  {{ row.category.name_tc || row.category.name_en }}
                </div>
                <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                  <span>已用 {{ formatCurrency(row.spent, appData.currency.value) }}</span>
                  <span>上限 {{ row.target ? formatCurrency(row.target, appData.currency.value) : '未設定' }}</span>
                  <span>餘額 {{ formatCurrency(row.remaining, appData.currency.value) }}</span>
                </div>
              </div>
              <span class="shrink-0 text-sm font-semibold" :class="rowTone(row)">
                {{ rowStatus(row) }}
              </span>
            </div>

            <div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${row.target ? row.ratio * 100 : row.spent > 0 ? 100 : 0}%`,
                  backgroundColor: withHash(row.category.color_code),
                }"
              />
            </div>
          </div>
        </div>
        <EmptyState v-else class="mt-4" title="尚未有分類預算資料" message="先到預算週期頁設定分類上限，這裡才會開始有分析。" />
      </section>

      <div class="grid gap-6">
        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 class="text-lg font-semibold text-stone-950">支出集中度</h2>
          <p class="mt-1 text-sm text-stone-500">看清楚現在哪些分類正在吃掉最多預算空間。</p>

          <div v-if="spendingShareRows.length" class="mt-4 grid gap-4">
            <div v-for="row in spendingShareRows" :key="row.category.category_id">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-semibold text-stone-900">{{ row.category.name_tc || row.category.name_en }}</span>
                <span class="text-stone-500">
                  {{ formatCurrency(row.spent, appData.currency.value) }} · {{ formatPercent(row.share) }}
                </span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${row.share * 100}%`, backgroundColor: withHash(row.category.color_code) }"
                />
              </div>
            </div>
          </div>
          <EmptyState v-else class="mt-4" title="還沒有支出" message="記下一些支出後，這裡會顯示分類支出佔比。" />
        </section>

        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 class="text-lg font-semibold text-stone-950">風險提示</h2>
          <p class="mt-1 text-sm text-stone-500">集中看需要優先留意的分類。</p>

          <div v-if="riskRows.length" class="mt-4 grid gap-3">
            <div
              v-for="row in riskRows"
              :key="row.category.category_id"
              class="rounded-md border border-stone-200 bg-stone-50 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="font-semibold text-stone-900">{{ row.category.name_tc || row.category.name_en }}</span>
                <span class="text-sm font-semibold" :class="rowTone(row)">{{ rowStatus(row) }}</span>
              </div>
              <p class="mt-1 text-sm text-stone-600">
                {{ formatCurrency(row.spent, appData.currency.value) }} / 
                {{ row.target ? formatCurrency(row.target, appData.currency.value) : '未設定上限' }}
              </p>
            </div>
          </div>
          <EmptyState v-else class="mt-4" title="目前沒有明顯風險" message="分類預算狀態健康，暫時沒有超支或逼近上限的項目。" />
        </section>
      </div>
    </div>
  </div>
</template>
