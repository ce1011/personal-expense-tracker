<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { AlertTriangle, PieChart, TrendingUp } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import CategoryProgressItem from '@/components/categoryBudget/CategoryProgressItem.vue'
import { useAppData } from '@/composables/useAppData'
import { buildCategoryBudgetInsights } from '@/lib/categoryBudgetInsights'
import { buildCategoryProgressRows } from '@/lib/categoryProgress'
import { getRemainingCycleDays } from '@/lib/budgetCycle'
import { startOfLocalDay } from '@/lib/date'
import { formatCurrency, formatPercent, withHash } from '@/lib/formatters'

const appData = useAppData()
const budgetProgressMode = shallowRef<'today' | 'cycle'>('today')

const todayExpenses = computed(() => {
  const start = startOfLocalDay(new Date())
  const end = start + 86_400_000
  return appData.data.value.expenses.filter(
    (expense) => expense.date >= start && expense.date < end,
  )
})

const remainingCycleDays = computed(() => {
  const window = appData.currentWindow.value

  if (!window) {
    return 1
  }

  return getRemainingCycleDays(window)
})

const progressRows = computed(() => {
  const expenses =
    budgetProgressMode.value === 'today' ? todayExpenses.value : appData.cycleExpenses.value
  const targetDivisor = budgetProgressMode.value === 'today' ? remainingCycleDays.value : 1

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

const totalSpent = computed(() => rankedRows.value.reduce((sum, row) => sum + row.spent, 0))

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

function rowTone(row: (typeof rankedRows.value)[number]): 'danger' | 'warning' | 'good' {
  if (row.target > 0 && row.spent > row.target) {
    return 'danger'
  }

  if (row.target > 0 && row.ratio >= 0.8) {
    return 'warning'
  }

  return 'good'
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
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">分類預算</p>
      <h1 class="mt-1 text-h1 font-bold text-text">分類預算進度</h1>
      <p class="mt-1 text-body-sm text-text-2">
        用分類角度看清楚本期預算健康、今日可用空間、支出集中位置，以及哪些分類開始失速。
      </p>
    </header>

    <div class="inline-flex rounded-xl border border-border bg-accent p-1">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
        :class="
          budgetProgressMode === 'today'
            ? 'bg-surface text-text shadow-sm'
            : 'text-text-2 hover:text-text'
        "
        @click="budgetProgressMode = 'today'"
      >
        今日
      </button>
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
        :class="
          budgetProgressMode === 'cycle'
            ? 'bg-surface text-text shadow-sm'
            : 'text-text-2 hover:text-text'
        "
        @click="budgetProgressMode = 'cycle'"
      >
        本期
      </button>
    </div>

    <section v-if="appData.loading.value" class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <SkeletonCard v-for="index in 4" :key="index" />
    </section>

    <section v-else class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">預算上限</p>
        <p class="mt-2 text-amount font-bold text-text">
          {{ formatCurrency(insights.totalTarget, appData.currency.value) }}
        </p>
        <p class="mt-1 text-caption text-text-2">
          {{ budgetProgressMode === 'today' ? '以每日剩餘預算上限計算' : '所有分類上限合計' }}
        </p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">已使用</p>
        <p class="mt-2 text-amount font-bold text-text">
          {{ formatCurrency(insights.totalSpent, appData.currency.value) }}
        </p>
        <p class="mt-1 text-caption text-text-2">{{ insights.activeCategories }} 個分類有活動</p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">進度餘額</p>
        <p
          class="mt-2 text-amount font-bold"
          :class="insights.totalRemaining > 0 ? 'text-primary' : 'text-danger'"
        >
          {{ formatCurrency(insights.totalRemaining, appData.currency.value) }}
        </p>
        <p class="mt-1 text-caption text-text-2">
          {{ insights.overBudgetCount }} 個超支，{{ insights.nearLimitCount }} 個接近上限
        </p>
      </BaseCard>
      <BaseCard>
        <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">使用率</p>
        <p
          class="mt-2 text-amount font-bold"
          :class="insights.utilizationRate >= 1 ? 'text-danger' : 'text-primary'"
        >
          {{ formatPercent(insights.utilizationRate) }}
        </p>
        <p class="mt-1 text-caption text-text-2">
          {{ insights.unplannedCount }} 個分類未設上限但已有支出
        </p>
      </BaseCard>
    </section>

    <SkeletonCard v-if="appData.loading.value" :lines="4" />

    <BaseCard v-else-if="riskRows.length" variant="warning">
      <div class="flex items-center gap-2">
        <AlertTriangle class="size-5 text-warning" aria-hidden="true" />
        <h2 class="text-h3 font-semibold text-text">風險提示</h2>
      </div>
      <p class="mt-1 text-body-sm text-text-2">集中看需要優先留意的分類。</p>

      <div class="mt-4 grid gap-3">
        <div
          v-for="row in riskRows"
          :key="row.category.category_id"
          class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <div class="flex items-center gap-3">
            <span
              class="size-3 rounded-full"
              :style="{ backgroundColor: withHash(row.category.color_code) }"
            />
            <div>
              <p class="text-body-sm font-semibold text-text">
                {{ row.category.name_tc || row.category.name_en }}
              </p>
              <p class="text-caption text-text-2">
                {{ formatCurrency(row.spent, appData.currency.value) }} /
                {{ row.target ? formatCurrency(row.target, appData.currency.value) : '未設定上限' }}
              </p>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="{
              'bg-danger/10 text-danger': rowTone(row) === 'danger',
              'bg-warning/10 text-warning': rowTone(row) === 'warning',
              'bg-success/10 text-success': rowTone(row) === 'good',
            }"
          >
            {{ rowStatus(row) }}
          </span>
        </div>
      </div>
    </BaseCard>

    <div v-if="appData.loading.value" class="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
      <SkeletonCard :lines="6" />
      <SkeletonCard :lines="6" />
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
      <BaseCard>
        <div class="flex items-center gap-2">
          <TrendingUp class="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 class="text-h3 font-semibold text-text">分類進度</h2>
            <p class="text-body-sm text-text-2">
              {{
                budgetProgressMode === 'today'
                  ? '今日支出對比每日剩餘上限。'
                  : '本期支出對比分類總上限。'
              }}
            </p>
          </div>
        </div>

        <div v-if="rankedRows.length" class="mt-4 grid gap-4">
          <CategoryProgressItem
            v-for="row in rankedRows"
            :key="row.category.category_id"
            :row="row"
            :currency="appData.currency.value"
          />
        </div>
        <EmptyState
          v-else
          class="mt-4"
          :icon="AlertTriangle"
          title="尚未有分類預算資料"
          message="先到預算週期頁設定分類上限，這裡才會開始有分析。"
        />
      </BaseCard>

      <BaseCard>
        <div class="flex items-center gap-2">
          <PieChart class="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 class="text-h3 font-semibold text-text">支出集中度</h2>
            <p class="text-body-sm text-text-2">看清楚現在哪些分類正在吃掉最多預算空間。</p>
          </div>
        </div>

        <div v-if="spendingShareRows.length" class="mt-4 grid gap-4">
          <div v-for="row in spendingShareRows" :key="row.category.category_id">
            <div class="flex items-center justify-between gap-3 text-body-sm">
              <span class="font-semibold text-text">{{
                row.category.name_tc || row.category.name_en
              }}</span>
              <span class="text-text-2">
                {{ formatCurrency(row.spent, appData.currency.value) }} ·
                {{ formatPercent(row.share) }}
              </span>
            </div>
            <div
              class="mt-2 h-3 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              :aria-valuenow="Math.min(row.share * 100, 100)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-3 rounded-full transition-all"
                :style="{
                  width: `${Math.min(row.share * 100, 100)}%`,
                  backgroundColor: withHash(row.category.color_code),
                }"
              />
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          class="mt-4"
          :icon="PieChart"
          title="還沒有支出"
          message="記下一些支出後，這裡會顯示分類支出佔比。"
        />
      </BaseCard>
    </div>
  </div>
</template>
