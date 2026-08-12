<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
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
import { useDashboardData } from '@/composables/useDashboardData'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/lib/formatters'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const { dashboard, isTripMode, loading, error } = useDashboardData()
const router = useRouter()
const isWeeklyReviewOpen = shallowRef(false)
const { toast } = useToast()

const cycleLabel = computed(() => dashboard.value?.currentWindow?.label)
const currency = computed(() => dashboard.value?.currency ?? appData.currency.value)
const fxRateMap = computed(() => appData.fxRateMap.value)
const recentTransactions = computed(() => dashboard.value?.recentTransactions ?? [])
const activeTrip = computed(() => dashboard.value?.activeTrip)

function openWeeklyReview(): void {
  isWeeklyReviewOpen.value = true
}

function closeWeeklyReview(): void {
  isWeeklyReviewOpen.value = false
}

function showToast(message: string): void {
  toast({ description: message, duration: 2400 })
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
  const challenge = dashboard.value?.savingChallenges.find(
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
  showToast('已刪除儲蓄挑戰')
}

function goToTransactions(): void {
  void router.push('/transactions')
}

</script>

<template>
  <div class="dashboard-flow grid gap-4">
    <section v-if="loading" class="grid gap-4">
      <SkeletonCard :lines="3" />
      <div class="grid grid-cols-2 gap-3">
        <SkeletonCard :lines="2" />
        <SkeletonCard :lines="2" />
      </div>
      <SkeletonCard :lines="2" />
    </section>

    <section
      v-else-if="!isTripMode && dashboard"
      class="dashboard-sequence dashboard-sequence--primary grid gap-4"
    >
      <HeroCard
        :remaining-budget="dashboard.remainingBudget"
        :income-total="dashboard.cycleIncomeTotal"
        :expense-total="dashboard.cycleExpenseTotal"
        :saving-total="dashboard.cycleSavingTotal"
        :currency="currency"
        :cycle-label="cycleLabel"
        @weekly-review="openWeeklyReview"
      />

      <OverspendForecastCard :forecast="dashboard.overspendForecast" :currency="currency" />

      <button
        type="button"
        class="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40"
        @click="router.push('/history-review')"
      >
        <div>
          <p class="text-caption font-semibold uppercase tracking-[0.12em] text-primary">歷史回顧</p>
          <p class="mt-1 text-h3 font-semibold text-text">看結構、趨勢與財務健康</p>
          <p class="mt-1 text-body-sm text-text-2">必要 vs 想要、淨現金流、季節高峰與年度回顧。</p>
        </div>
        <ArrowRight class="size-5 shrink-0 text-primary" aria-hidden="true" />
      </button>

      <KpiGrid
        :today-available="dashboard.dailySafeToSpend.safeToSpendToday"
        :today-spent="dashboard.todaySpent"
        :saving-target="dashboard.currentCycle?.saving_target ?? 0"
        :fixed-expenses="dashboard.cycleFixedExpensesTotal"
        :currency="currency"
        :is-over-today="dashboard.dailySafeToSpend.isOverToday"
      />

      <div class="grid gap-4 lg:grid-cols-2">
        <SpendingStreakCard :streak="dashboard.spendingStreak" />
        <WeeklyCashflowCard :brief="dashboard.weeklyCashflowBrief" />
      </div>
    </section>

    <section v-if="error" class="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
      {{ error }}
    </section>

    <section v-if="loading" class="grid gap-4">
      <SkeletonCard :lines="2" />
      <SkeletonCard :lines="2" />
      <SkeletonList :rows="3" />
    </section>

    <section
      v-else-if="!isTripMode && dashboard"
      class="dashboard-sequence dashboard-sequence--secondary grid gap-4"
    >
      <QuickAddShortcuts
        :suggestions="dashboard.quickAddSuggestions"
        :expense-categories="dashboard.activeExpenseCategories"
        :income-categories="dashboard.activeIncomeCategories"
        :currency="currency"
        :fx-rate-map="fxRateMap"
        @create-expense="addExpense"
        @create-income="addIncome"
        @create-saving="addSaving"
      />
      <SavingChallengesList
        :challenges="dashboard.activeChallenges"
        :currency="currency"
        @create="createSavingChallenge"
        @update-status="updateSavingChallengeStatus"
        @delete="deleteSavingChallenge"
      />
      <RecurringExpensesSummary
        :fixed-total="dashboard.cycleFixedExpensesTotal"
        :upcoming-bills="dashboard.upcomingBills"
        :currency="currency"
      />
      <UnusualExpenseAlertsList :alerts="dashboard.unusualExpenseAlerts" />
      <CategoryAlertsList :alerts="dashboard.categoryAlerts" :currency="currency" />
    </section>

    <section v-else-if="isTripMode" class="dashboard-sequence grid gap-4">
      <BaseCard variant="primary">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-2">旅程模式</p>
        <h2 class="mt-1 text-xl font-bold text-text">{{ activeTrip?.name }}</h2>
        <p class="mt-1 text-sm text-text-2">
          {{ formatDate(activeTrip?.start_date ?? 0) }} -
          {{ formatDate(activeTrip?.end_date ?? 0) }}
        </p>
        <p class="mt-1 text-xs text-text-3">
          目前只顯示已綁定這次旅程的交易。要切換模式請使用頂部選單。
        </p>
      </BaseCard>
    </section>

    <section class="dashboard-sequence dashboard-sequence--recent grid gap-3">
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

      <SkeletonList v-if="loading" :rows="5" />
      <BaseCard v-else-if="recentTransactions.length" class="overflow-hidden p-0">
        <TransitionGroup name="transaction-stagger" tag="div" class="divide-y divide-border">
          <TransactionListItem
            v-for="transaction in recentTransactions"
            :key="`${transaction.kind}-${transaction.id}`"
            :item="transaction"
            :expense-categories="dashboard?.expenseCategories ?? []"
            :income-categories="dashboard?.incomeCategories ?? []"
            :currency="currency"
            @select="goToTransactions"
          />
        </TransitionGroup>
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
      v-if="isWeeklyReviewOpen && dashboard"
      :review="dashboard.weeklyReview"
      :currency="currency"
      @close="closeWeeklyReview"
    />

  </div>
</template>

<style scoped>
.dashboard-sequence {
  animation: dashboard-arrive 520ms backwards cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-sequence--secondary {
  animation-delay: 90ms;
}

.dashboard-sequence--recent {
  animation-delay: 160ms;
}

.transaction-stagger-enter-active,
.transaction-stagger-leave-active,
.transaction-stagger-move {
  transition:
    opacity 240ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.transaction-stagger-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.transaction-stagger-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@keyframes dashboard-arrive {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}
</style>
