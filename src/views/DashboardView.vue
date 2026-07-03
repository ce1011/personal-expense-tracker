<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import HeroCard from '@/components/dashboard/HeroCard.vue'
import KpiGrid from '@/components/dashboard/KpiGrid.vue'
import CategoryAlertsList from '@/components/dailyFinance/CategoryAlertsList.vue'
import RecurringExpensesSummary from '@/components/dailyFinance/RecurringExpensesSummary.vue'
import SavingChallengesList from '@/components/dailyFinance/SavingChallengesList.vue'
import QuickAddShortcuts from '@/components/dailyFinance/QuickAddShortcuts.vue'
import WeeklyReviewModal from '@/components/dailyFinance/WeeklyReviewModal.vue'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'
import { useAppData } from '@/composables/useAppData'
import { startOfLocalDay } from '@/lib/date'
import { formatDate } from '@/lib/formatters'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const router = useRouter()
const isWeeklyReviewOpen = shallowRef(false)
const toastMessage = shallowRef('')
let toastTimeout: ReturnType<typeof setTimeout> | undefined

const isTripMode = computed(() => Boolean(appData.activeTrip.value))
const cycleLabel = computed(() => appData.currentWindow.value?.label)
const visibleRecentTransactions = computed(() => {
  const endOfToday = startOfLocalDay(new Date()) + 86_400_000
  const source = isTripMode.value
    ? appData.tripTransactions.value
    : appData.combinedTransactions.value

  return source.filter((transaction) => transaction.date < endOfToday).slice(0, 8)
})

function openWeeklyReview(): void {
  isWeeklyReviewOpen.value = true
}

function closeWeeklyReview(): void {
  isWeeklyReviewOpen.value = false
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
  showToast('已新增支出')
}

async function addIncome(draft: IncomeDraft): Promise<void> {
  await appData.addIncome(draft)
  showToast('已新增收入')
}

async function addSaving(draft: SavingDraft): Promise<void> {
  await appData.addSaving(draft)
  showToast('已新增儲蓄')
}

async function createSavingChallenge(name: string, target_amount: number): Promise<void> {
  await appData.addSavingChallenge(name, target_amount)
  showToast('已新增儲蓄挑戰')
}

async function updateSavingChallengeStatus(
  challengeId: string,
  status: 'active' | 'completed' | 'paused',
): Promise<void> {
  const challenge = appData.savingChallenges.value.find(
    (entry) => entry.challenge_id === challengeId,
  )

  if (!challenge) {
    return
  }

  await appData.updateSavingChallenge(challengeId, {
    name: challenge.name,
    target_amount: challenge.target_amount,
    status,
  })
}

async function deleteSavingChallenge(challengeId: string): Promise<void> {
  await appData.deleteSavingChallenge(challengeId)
}

function goToTransactions(): void {
  void router.push('/transactions')
}

onBeforeUnmount(() => {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }
})
</script>

<template>
  <div class="grid gap-4">
    <section v-if="!isTripMode" class="grid gap-4">
      <HeroCard
        :remaining-budget="appData.remainingBudget.value"
        :income-total="appData.cycleIncomeTotal.value"
        :expense-total="appData.cycleExpenseTotal.value"
        :currency="appData.currency.value"
        :cycle-label="cycleLabel"
        @weekly-review="openWeeklyReview"
      />

      <KpiGrid
        :today-available="appData.dailySafeToSpend.value.safeToSpendToday"
        :today-spent="appData.todaySpent.value"
        :saving-target="appData.currentCycle.value?.saving_target ?? 0"
        :fixed-expenses="appData.cycleFixedExpensesTotal.value"
        :currency="appData.currency.value"
        :is-over-today="appData.dailySafeToSpend.value.isOverToday"
      />
    </section>

    <section
      v-if="appData.error.value"
      class="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {{ appData.error.value }}
    </section>

    <section v-if="!isTripMode" class="grid gap-4">
      <QuickAddShortcuts
        :suggestions="appData.quickAddSuggestions.value"
        :expense-categories="appData.activeExpenseCategories.value"
        :income-categories="appData.activeIncomeCategories.value"
        :currency="appData.currency.value"
        :fx-rate-map="appData.fxRateMap.value"
        @create-expense="addExpense"
        @create-income="addIncome"
        @create-saving="addSaving"
      />
      <SavingChallengesList
        :challenges="appData.activeChallenges.value"
        :currency="appData.currency.value"
        @create="createSavingChallenge"
        @update-status="updateSavingChallengeStatus"
        @delete="deleteSavingChallenge"
      />
      <RecurringExpensesSummary
        :fixed-total="appData.cycleFixedExpensesTotal.value"
        :upcoming-bills="appData.upcomingBills.value"
        :currency="appData.currency.value"
      />
      <CategoryAlertsList
        :alerts="appData.categoryAlerts.value"
        :currency="appData.currency.value"
      />
    </section>

    <section v-else class="grid gap-4">
      <BaseCard variant="primary">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-2">旅程模式</p>
        <h2 class="mt-1 text-xl font-bold text-text">{{ appData.activeTrip.value?.name }}</h2>
        <p class="mt-1 text-sm text-text-2">
          {{ formatDate(appData.activeTrip.value?.start_date ?? 0) }} -
          {{ formatDate(appData.activeTrip.value?.end_date ?? 0) }}
        </p>
        <p class="mt-1 text-xs text-text-3">
          目前只顯示已綁定這次旅程的交易。要切換模式請使用頂部選單。
        </p>
      </BaseCard>
    </section>

    <section class="grid gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text">
          {{ isTripMode ? '旅程最近交易' : '最近交易' }}
        </h2>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-2"
          @click="goToTransactions"
        >
          查看全部
          <ArrowRight class="size-4" aria-hidden="true" />
        </button>
      </div>

      <BaseCard v-if="visibleRecentTransactions.length" class="overflow-hidden p-0">
        <div class="divide-y divide-border">
          <TransactionListItem
            v-for="transaction in visibleRecentTransactions"
            :key="`${transaction.kind}-${transaction.id}`"
            :item="transaction"
            :expense-categories="appData.data.value.expenseCategories"
            :income-categories="appData.data.value.incomeCategories"
            :currency="appData.currency.value"
            @select="goToTransactions"
          />
        </div>
      </BaseCard>
      <EmptyState
        v-else
        :icon="ArrowRight"
        :title="isTripMode ? '這個旅程還未綁定任何交易' : '還沒有交易紀錄'"
        :message="
          isTripMode
            ? '這個旅程還未綁定任何交易，可以先用快速記一筆開始記錄。'
            : '用底部「記一筆」按鈕新增第一筆支出、收入或儲蓄。'
        "
      />
    </section>

    <WeeklyReviewModal
      v-if="isWeeklyReviewOpen"
      :review="appData.weeklyReview.value"
      :currency="appData.currency.value"
      @close="closeWeeklyReview"
    />

    <div
      v-if="toastMessage"
      class="fixed bottom-24 right-4 z-50 rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm font-semibold text-primary shadow-lg max-sm:bottom-28 max-sm:right-1/2 max-sm:translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>
