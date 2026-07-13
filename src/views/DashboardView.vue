<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import BaseToast from '@/components/base/BaseToast.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import HeroCard from '@/components/dashboard/HeroCard.vue'
import KpiGrid from '@/components/dashboard/KpiGrid.vue'
import CategoryAlertsList from '@/components/dailyFinance/CategoryAlertsList.vue'
import OverspendForecastCard from '@/components/dailyFinance/OverspendForecastCard.vue'
import RecurringExpensesSummary from '@/components/dailyFinance/RecurringExpensesSummary.vue'
import SavingChallengesList from '@/components/dailyFinance/SavingChallengesList.vue'
import QuickAddShortcuts from '@/components/dailyFinance/QuickAddShortcuts.vue'
import SpendingStreakCard from '@/components/dailyFinance/SpendingStreakCard.vue'
import UnusualExpenseAlertsList from '@/components/dailyFinance/UnusualExpenseAlertsList.vue'
import WeeklyCashflowCard from '@/components/dailyFinance/WeeklyCashflowCard.vue'
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

async function showToast(message: string): Promise<void> {
  clearTimeout(toastTimeout)
  toastMessage.value = ''
  await nextTick()
  toastMessage.value = message

  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 2600)
}

function clearToast(): void {
  toastMessage.value = ''
  clearTimeout(toastTimeout)
}

async function addExpense(draft: ExpenseDraft): Promise<void> {
  await appData.addExpense(draft)
  await showToast('已新增支出')
}

async function addIncome(draft: IncomeDraft): Promise<void> {
  await appData.addIncome(draft)
  await showToast('已新增收入')
}

async function addSaving(draft: SavingDraft): Promise<void> {
  await appData.addSaving(draft)
  await showToast('已新增儲蓄')
}

async function createSavingChallenge(name: string, target_amount: number): Promise<void> {
  await appData.addSavingChallenge(name, target_amount)
  await showToast('已新增儲蓄挑戰')
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
  await showToast('已刪除儲蓄挑戰')
}

function goToTransactions(): void {
  void router.push('/transactions')
}

onBeforeUnmount(() => {
  clearTimeout(toastTimeout)
})
</script>

<template>
  <div class="grid gap-4">
    <section v-if="appData.loading.value" class="grid gap-4">
      <SkeletonCard :lines="3" />
      <div class="grid grid-cols-2 gap-3">
        <SkeletonCard :lines="2" />
        <SkeletonCard :lines="2" />
      </div>
      <SkeletonCard :lines="2" />
    </section>

    <section v-else-if="!isTripMode" class="grid gap-4">
      <HeroCard
        :remaining-budget="appData.remainingBudget.value"
        :income-total="appData.cycleIncomeTotal.value"
        :expense-total="appData.cycleExpenseTotal.value"
        :saving-total="appData.cycleSavingTotal.value"
        :currency="appData.currency.value"
        :cycle-label="cycleLabel"
        @weekly-review="openWeeklyReview"
      />

      <OverspendForecastCard
        :forecast="appData.overspendForecast.value"
        :currency="appData.currency.value"
      />

      <KpiGrid
        :today-available="appData.dailySafeToSpend.value.safeToSpendToday"
        :today-spent="appData.todaySpent.value"
        :saving-target="appData.currentCycle.value?.saving_target ?? 0"
        :fixed-expenses="appData.cycleFixedExpensesTotal.value"
        :currency="appData.currency.value"
        :is-over-today="appData.dailySafeToSpend.value.isOverToday"
      />

      <div class="grid gap-4 lg:grid-cols-2">
        <SpendingStreakCard :streak="appData.spendingStreak.value" />
        <WeeklyCashflowCard :brief="appData.weeklyCashflowBrief.value" />
      </div>
    </section>

    <section
      v-if="appData.error.value"
      class="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {{ appData.error.value }}
    </section>

    <section v-if="appData.loading.value" class="grid gap-4">
      <SkeletonCard :lines="2" />
      <SkeletonCard :lines="2" />
      <SkeletonList :rows="3" />
    </section>

    <section v-else-if="!isTripMode" class="grid gap-4">
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
      <UnusualExpenseAlertsList :alerts="appData.unusualExpenseAlerts.value" />
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

      <SkeletonList v-if="appData.loading.value" :rows="5" />
      <BaseCard v-else-if="visibleRecentTransactions.length" class="overflow-hidden p-0">
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

    <BaseToast v-if="toastMessage" :message="toastMessage" :duration="2400" @close="clearToast" />
  </div>
</template>
