<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { CirclePlus, X } from 'lucide-vue-next'

import EmptyState from '@/components/common/EmptyState.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import CategoryAlertsList from '@/components/dailyFinance/CategoryAlertsList.vue'
import RecurringExpensesSummary from '@/components/dailyFinance/RecurringExpensesSummary.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import { useAppData } from '@/composables/useAppData'
import { startOfLocalDay } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const isQuickAddOpen = shallowRef(false)
const toastMessage = shallowRef('')
let toastTimeout: ReturnType<typeof setTimeout> | undefined

const isTripMode = computed(() => Boolean(appData.activeTrip.value))
const tripDateLabel = computed(() => {
  const trip = appData.activeTrip.value

  if (!trip) {
    return ''
  }

  return `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
})
const tripTotalDays = computed(() => {
  const trip = appData.activeTrip.value

  if (!trip) {
    return 0
  }

  const startDay = startOfLocalDay(new Date(trip.start_date))
  const endDay = startOfLocalDay(new Date(trip.end_date))
  return Math.floor((endDay - startDay) / 86_400_000) + 1
})
const tripDaysWithTransactions = computed(() =>
  appData.tripDailyBreakdown.value.filter((day) => day.count > 0).length,
)
const tripTransactionCount = computed(() => appData.tripTransactions.value.length)
const visibleRecentTransactions = computed(() => {
  const endOfToday = startOfLocalDay(new Date()) + 86_400_000
  const source = isTripMode.value ? appData.tripTransactions.value : appData.combinedTransactions.value

  return source
    .filter((transaction) => transaction.date < endOfToday)
    .slice(0, 8)
})

function openQuickAdd(): void {
  isQuickAddOpen.value = true
}

function closeQuickAdd(): void {
  isQuickAddOpen.value = false
}

function showToast(message: string): void {
  toastMessage.value = message

  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}

async function addExpense(draft: ExpenseDraft): Promise<void> {
  await appData.addExpense(draft)
  closeQuickAdd()
  showToast('已新增支出')
}

async function addIncome(draft: IncomeDraft): Promise<void> {
  await appData.addIncome(draft)
  closeQuickAdd()
  showToast('已新增收入')
}

async function addSaving(draft: SavingDraft): Promise<void> {
  await appData.addSaving(draft)
  closeQuickAdd()
  showToast('已新增儲蓄')
}

onBeforeUnmount(() => {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }
})
</script>

<template>
  <div class="grid gap-6">
    <section class="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            {{ isTripMode ? '旅程模式' : '總覽' }}
          </p>
          <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
            {{ isTripMode ? appData.activeTrip.value?.name : '本期收支狀況' }}
          </h1>
          <p class="mt-2 text-sm text-stone-600">
            {{
              isTripMode
                ? `${tripDateLabel} · ${appData.activeTrip.value?.destination ?? ''}`
                : appData.currentWindow.value?.label ?? '先建立預算週期，之後所有交易都會按入糧日自動歸期。'
            }}
          </p>
          <p v-if="isTripMode" class="mt-2 text-sm text-stone-500">
            目前只顯示已綁定這次旅程的交易，方便集中查看預算與每日開支節奏。
          </p>
        </div>
        <p v-if="appData.error.value" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ appData.error.value }}
        </p>
      </div>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex h-full flex-col justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">快速記一筆</h2>
            <p class="mt-1 text-sm text-stone-500">
              {{ isTripMode ? '新增後會自動帶入目前旅程，支出、收入或儲蓄都可以快速記錄。' : '用彈出視窗快速新增支出、收入或儲蓄。' }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
            @click="openQuickAdd"
          >
            <CirclePlus class="size-4" aria-hidden="true" />
            新增交易
          </button>
        </div>
      </section>
    </section>

    <section v-if="!isTripMode" class="grid gap-3 md:grid-cols-4">
      <MetricCard
        label="收入"
        :value="formatCurrency(appData.cycleIncomeTotal.value, appData.currency.value)"
        :detail="`本期 ${appData.cycleIncomes.value.length} 筆收入，加上週期設定收入`"
        tone="good"
      />
      <MetricCard
        label="支出"
        :value="formatCurrency(appData.cycleExpenseTotal.value, appData.currency.value)"
        :detail="`本期 ${appData.cycleExpenses.value.length} 筆支出，另加儲蓄轉出`"
      />
      <MetricCard
        label="結餘"
        :value="formatCurrency(appData.remainingBudget.value, appData.currency.value)"
        :detail="`儲蓄目標 ${formatCurrency(appData.currentCycle.value?.saving_target ?? 0, appData.currency.value)}`"
        :tone="appData.remainingBudget.value >= 0 ? 'good' : 'warn'"
      />
      <MetricCard
        label="今日可用"
        :value="formatCurrency(appData.dailySafeToSpend.value.safeToSpendToday, appData.currency.value)"
        :detail="`今日已用 ${formatCurrency(appData.todaySpent.value, appData.currency.value)}`"
        :tone="appData.dailySafeToSpend.value.isOverToday ? 'warn' : 'good'"
      />
    </section>

    <section v-if="!isTripMode" class="grid gap-3 lg:grid-cols-2">
      <CategoryAlertsList
        :alerts="appData.categoryAlerts.value"
        :currency="appData.currency.value"
      />
      <RecurringExpensesSummary
        :fixed-total="appData.cycleFixedExpensesTotal.value"
        :upcoming-bills="appData.upcomingBills.value"
        :currency="appData.currency.value"
      />
    </section>

    <section v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="總預算"
        :value="formatCurrency(appData.activeTrip.value?.budget_amount ?? 0, appData.activeTrip.value?.budget_currency ?? appData.currency.value)"
        :detail="`旅程共 ${tripTotalDays} 日`"
        tone="good"
      />
      <MetricCard
        label="已支出"
        :value="formatCurrency(appData.tripSpentTotal.value, appData.currency.value)"
        :detail="`已記錄 ${tripTransactionCount} 筆旅程交易`"
      />
      <MetricCard
        label="剩餘預算"
        :value="formatCurrency(appData.tripRemainingBudget.value, appData.currency.value)"
        :detail="`${tripDaysWithTransactions} / ${tripTotalDays} 日已有交易`"
        :tone="appData.tripRemainingBudget.value >= 0 ? 'good' : 'warn'"
      />
      <MetricCard
        label="每日拆分"
        :value="`${appData.tripDailyBreakdown.value.length} 日`"
        detail="以下按旅程日序查看每天支出與交易明細。"
      />
    </section>

    <section v-if="isTripMode" class="grid gap-3 lg:grid-cols-2">
      <article
        v-for="day in appData.tripDailyBreakdown.value"
        :key="day.date"
        class="rounded-md border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-stone-950">{{ formatDate(day.date) }}</h2>
            <p class="mt-1 text-sm text-stone-500">
              {{ day.count ? `${day.count} 筆交易` : '這一天尚未記錄旅程交易' }}
            </p>
          </div>
          <p class="text-right text-sm font-semibold text-stone-950">
            {{ formatCurrency(day.total, appData.currency.value) }}
          </p>
        </div>

        <TransactionList
          v-if="day.transactions.length"
          class="mt-4"
          :items="day.transactions"
          :expense-categories="appData.data.value.expenseCategories"
          :income-categories="appData.data.value.incomeCategories"
          :currency="appData.currency.value"
        />
        <p v-else class="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-500">
          建議在旅途中當天記帳，之後回看每日拆分會更清楚。
        </p>
      </article>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-stone-950">{{ isTripMode ? '旅程最近交易' : '最近交易' }}</h2>
      </div>
      <TransactionList
        v-if="visibleRecentTransactions.length"
        :items="visibleRecentTransactions"
        :expense-categories="appData.data.value.expenseCategories"
        :income-categories="appData.data.value.incomeCategories"
        :currency="appData.currency.value"
      />
      <EmptyState
        v-else
        title="還沒有交易紀錄"
        :message="
          isTripMode
            ? '這個旅程還未綁定任何交易，可以先用快速記一筆開始記錄。'
            : '用右側快速記一筆，先把第一筆支出、收入或儲蓄記下來。'
        "
      />
    </section>

    <div
      v-if="isQuickAddOpen"
      class="fixed inset-0 z-40 grid place-items-center bg-stone-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="closeQuickAdd"
    >
      <div class="w-full max-w-4xl rounded-md bg-[#f9f6ef] p-4 shadow-xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-stone-950">快速記一筆</h2>
            <p class="mt-1 text-sm text-stone-500">新增後會立即寫入帳目，並自動換算成港幣。</p>
          </div>
          <button
            type="button"
            class="rounded-md border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-50"
            @click="closeQuickAdd"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <TransactionForm
          :expense-categories="appData.activeExpenseCategories.value"
          :income-categories="appData.activeIncomeCategories.value"
          :trip-options="appData.trips.value"
          :default-trip-id="appData.activeTripId.value || undefined"
          :fx-rate-map="appData.fxRateMap.value"
          :latest-fx-date="appData.latestFxDate.value"
          @create-expense="addExpense"
          @create-income="addIncome"
          @create-saving="addSaving"
        />
      </div>
    </div>

    <div
      v-if="toastMessage"
      class="fixed bottom-4 right-4 z-50 rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg"
      role="status"
      aria-live="polite"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>
