<script setup lang="ts">
import { FileText, TrendingDown, TrendingUp } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
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
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">每月快照</p>
      <h1 class="mt-1 text-h1 font-bold text-text">本期財務總覽</h1>
      <p class="mt-1 text-body-sm text-text-2">{{ snapshot.cycleWindow.label }}</p>
    </header>

    <div v-if="appData.loading.value" class="grid gap-4">
      <SkeletonCard :lines="3" />
      <section class="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
      <SkeletonCard :lines="3" />
      <SkeletonCard :lines="5" />
    </div>

    <template v-else>
      <BaseCard variant="primary">
        <div class="flex items-center gap-2">
          <FileText class="size-5 text-primary" aria-hidden="true" />
          <div>
            <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
              本期結餘
            </p>
            <p class="mt-1 text-amount-lg font-bold text-text">
              {{ formatCurrency(snapshot.remainingBudget, appData.currency.value) }}
            </p>
            <p class="mt-1 text-body-sm text-text-2">
              日均支出 {{ formatCurrency(snapshot.dailyAverageSpent, appData.currency.value) }}
            </p>
          </div>
        </div>
      </BaseCard>

      <section class="grid grid-cols-2 gap-3">
        <BaseCard>
          <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">收入</p>
          <p class="mt-2 text-amount font-bold text-primary">
            {{ formatCurrency(snapshot.incomeTotal, appData.currency.value) }}
          </p>
        </BaseCard>
        <BaseCard>
          <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">支出</p>
          <p class="mt-2 text-amount font-bold text-danger">
            {{ formatCurrency(snapshot.expenseTotal, appData.currency.value) }}
          </p>
        </BaseCard>
        <BaseCard>
          <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">儲蓄</p>
          <p class="mt-2 text-amount font-bold text-primary">
            {{ formatCurrency(snapshot.savingTotal, appData.currency.value) }}
          </p>
        </BaseCard>
        <BaseCard>
          <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">儲蓄率</p>
          <p class="mt-2 text-amount font-bold text-primary">
            {{ formatPercent(snapshot.savingsRate) }}
          </p>
        </BaseCard>
      </section>

      <BaseCard>
        <div class="flex items-center gap-2">
          <TrendingUp class="size-5 text-primary" aria-hidden="true" />
          <h2 class="text-h3 font-semibold text-text">與上週期比較</h2>
        </div>

        <div v-if="snapshot.vsLastCycle" class="mt-4 grid gap-3">
          <div
            class="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
          >
            <span class="text-body-sm text-text-2">支出變化</span>
            <span
              class="flex items-center gap-1 font-semibold"
              :class="{
                'text-danger': snapshot.vsLastCycle.expenseDelta > 0,
                'text-primary': snapshot.vsLastCycle.expenseDelta < 0,
                'text-text-2': snapshot.vsLastCycle.expenseDelta === 0,
              }"
            >
              <TrendingUp
                v-if="snapshot.vsLastCycle.expenseDelta > 0"
                class="size-4"
                aria-hidden="true"
              />
              <TrendingDown
                v-else-if="snapshot.vsLastCycle.expenseDelta < 0"
                class="size-4"
                aria-hidden="true"
              />
              {{ deltaLabel(snapshot.vsLastCycle.expenseDelta) }}
              （{{ Math.round(snapshot.vsLastCycle.expenseDeltaPercent) }}%）
            </span>
          </div>
          <div
            class="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
          >
            <span class="text-body-sm text-text-2">儲蓄變化</span>
            <span
              class="flex items-center gap-1 font-semibold"
              :class="{
                'text-primary': snapshot.vsLastCycle.savingDelta > 0,
                'text-danger': snapshot.vsLastCycle.savingDelta < 0,
                'text-text-2': snapshot.vsLastCycle.savingDelta === 0,
              }"
            >
              <TrendingUp
                v-if="snapshot.vsLastCycle.savingDelta > 0"
                class="size-4"
                aria-hidden="true"
              />
              <TrendingDown
                v-else-if="snapshot.vsLastCycle.savingDelta < 0"
                class="size-4"
                aria-hidden="true"
              />
              {{ deltaLabel(snapshot.vsLastCycle.savingDelta) }}
            </span>
          </div>
        </div>
        <p v-else class="mt-4 text-body-sm text-text-2">沒有上週期資料可比較</p>
      </BaseCard>

      <BaseCard>
        <h2 class="text-h3 font-semibold text-text">主要支出分類</h2>

        <div v-if="snapshot.topExpenseCategories.length" class="mt-4 grid gap-4">
          <div v-for="category in snapshot.topExpenseCategories" :key="category.category_id">
            <div class="flex items-center justify-between text-body-sm">
              <span class="font-semibold text-text">{{ category.name }}</span>
              <span class="text-text-2">
                {{ formatCurrency(category.amount, appData.currency.value) }} ·
                {{ Math.round(category.percentage) }}%
              </span>
            </div>
            <div
              class="mt-2 h-3 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              :aria-valuenow="Math.min(category.percentage, 100)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-3 rounded-full bg-primary transition-all"
                :style="{ width: `${Math.min(category.percentage, 100)}%` }"
              />
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          class="mt-4"
          :icon="FileText"
          title="本期尚未有支出紀錄"
          message="記下一些支出後，這裡會顯示主要支出分類佔比。"
        />
      </BaseCard>
    </template>
  </div>
</template>
