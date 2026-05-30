<script setup lang="ts">
import { computed } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import { useAppData } from '@/composables/useAppData'
import { formatCurrency, formatPercent, withHash } from '@/lib/formatters'
import type { ExpenseDraft, IncomeDraft } from '@/types/app-data'

const appData = useAppData()

const targetRows = computed(() => {
  const cycle = appData.currentCycle.value
  const totals = new Map<string, number>()

  for (const expense of appData.cycleExpenses.value) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }

  return appData.activeExpenseCategories.value.map((category) => {
    const target =
      appData.data.value.targetExpenses.find(
        (limit) => limit.cycle_id === cycle?.cycle_id && limit.category_id === category.category_id,
      )?.amount ?? 0
    const spent = totals.get(category.category_id) ?? 0
    const ratio = target > 0 ? Math.min(1, spent / target) : 0

    return { category, target, spent, ratio }
  })
})

function addExpense(draft: ExpenseDraft): void {
  void appData.addExpense(draft)
}

function addIncome(draft: IncomeDraft): void {
  void appData.addIncome(draft)
}
</script>

<template>
  <div class="grid gap-6">
    <section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">總覽</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">本期收支狀況</h1>
        <p class="mt-2 text-sm text-stone-600">
          {{ appData.currentWindow.value?.label ?? '先建立預算週期，之後所有交易都會按入糧日自動歸期。' }}
        </p>
      </div>
      <p v-if="appData.error.value" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ appData.error.value }}
      </p>
    </section>

    <section class="grid gap-3 md:grid-cols-4">
      <MetricCard
        label="收入"
        :value="formatCurrency(appData.cycleIncomeTotal.value, appData.currency.value)"
        :detail="`本期 ${appData.cycleIncomes.value.length} 筆收入，加上週期設定收入`"
        tone="good"
      />
      <MetricCard
        label="支出"
        :value="formatCurrency(appData.cycleExpenseTotal.value, appData.currency.value)"
        :detail="`本期 ${appData.cycleExpenses.value.length} 筆支出`"
      />
      <MetricCard
        label="結餘"
        :value="formatCurrency(appData.remainingBudget.value, appData.currency.value)"
        :detail="`儲蓄目標 ${formatCurrency(appData.currentCycle.value?.saving_target ?? 0, appData.currency.value)}`"
        :tone="appData.remainingBudget.value >= 0 ? 'good' : 'warn'"
      />
      <MetricCard
        label="儲蓄進度"
        :value="formatPercent(appData.savingProgress.value)"
        detail="按支出後剩餘金額計算"
      />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">分類預算進度</h2>
            <p class="text-sm text-stone-500">比較本期實際支出與分類上限。</p>
          </div>
        </div>

        <div v-if="targetRows.length" class="mt-4 grid gap-4">
          <div v-for="row in targetRows" :key="row.category.category_id">
            <div class="flex items-center justify-between gap-3 text-sm">
              <div class="flex items-center gap-2 font-semibold text-stone-900">
                <span class="size-3 rounded-full" :style="{ backgroundColor: withHash(row.category.color_code) }" />
                {{ row.category.name_tc || row.category.name_en }}
              </div>
              <span class="text-stone-500">
                {{ formatCurrency(row.spent, appData.currency.value) }} /
                {{ row.target ? formatCurrency(row.target, appData.currency.value) : '未設定上限' }}
              </span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${row.target ? row.ratio * 100 : 0}%`,
                  backgroundColor: withHash(row.category.color_code),
                }"
              />
            </div>
          </div>
        </div>
        <EmptyState v-else class="mt-4" title="尚未有分類" message="先建立支出分類，之後就可以設定分類預算。" />
      </section>

      <TransactionForm
        :expense-categories="appData.activeExpenseCategories.value"
        :income-categories="appData.activeIncomeCategories.value"
        :fx-rate-map="appData.fxRateMap.value"
        :latest-fx-date="appData.latestFxDate.value"
        compact
        @create-expense="addExpense"
        @create-income="addIncome"
      />
    </div>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-stone-950">最近交易</h2>
      </div>
      <TransactionList
        v-if="appData.recentTransactions.value.length"
        :items="appData.recentTransactions.value"
        :expense-categories="appData.data.value.expenseCategories"
        :income-categories="appData.data.value.incomeCategories"
        :currency="appData.currency.value"
      />
      <EmptyState v-else title="還沒有交易紀錄" message="用右側快速記一筆，先把第一筆支出或收入記下來。" />
    </section>
  </div>
</template>
