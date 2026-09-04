<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import {
  AlertTriangle,
  Landmark,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import UiDateRangePicker from '@/components/ui/UiDateRangePicker.vue'
import UiNumberField from '@/components/ui/UiNumberField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import { useAppData } from '@/composables/useAppData'
import { useHistoryReviewData } from '@/composables/useHistoryReviewData'
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters'
import { type HistoryRangePreset, type ShareDimension } from '@/lib/historyReview'
import type { AccountKind } from '@/types/app-data'

const appData = useAppData()
const { report, currency, accounts, range, customRange, selectRange, loading, error } =
  useHistoryReviewData()

type ReviewTab = 'structure' | 'trend' | 'networth' | 'health' | 'wrapped'

const tab = shallowRef<ReviewTab>('structure')
const dimension = shallowRef<ShareDimension>('category')
const comparison = shallowRef<'mom' | 'yoy'>('mom')
const wrappedKind = shallowRef<'month' | 'year'>('year')

const rangeItems: Array<{ value: HistoryRangePreset; label: string }> = [
  { value: '6m', label: '近 6 個月' },
  { value: '12m', label: '近 12 個月' },
  { value: 'ytd', label: '今年' },
  { value: 'all', label: '全部' },
  { value: 'custom', label: '自訂' },
]

const tabItems: Array<{ value: ReviewTab; label: string }> = [
  { value: 'structure', label: '結構' },
  { value: 'trend', label: '趨勢' },
  { value: 'networth', label: '淨值' },
  { value: 'health', label: '健康' },
  { value: 'wrapped', label: '回顧' },
]

const dimensionItems: Array<{ value: ShareDimension; label: string }> = [
  { value: 'category', label: '類別' },
  { value: 'subcategory', label: '子類別' },
  { value: 'payment', label: '支付方式' },
  { value: 'merchant', label: '商家' },
  { value: 'tag', label: '標籤' },
]

const slices = computed(() => report.value?.breakdowns[dimension.value] ?? [])
const comparisonReport = computed(() =>
  comparison.value === 'mom' ? report.value?.mom : report.value?.yoy,
)
const wrapped = computed(() =>
  wrappedKind.value === 'year' ? report.value?.wrappedYear : report.value?.wrappedMonth,
)
const healthTone = computed(() => {
  const score = report.value?.healthScore ?? 0
  if (score >= 75) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
})

const accountForm = reactive({
  name: '',
  kind: 'cash' as AccountKind,
  amount: 0,
})

const kindOptions = [
  { value: 'cash', label: '現金／存款' },
  { value: 'investment', label: '投資' },
  { value: 'liability', label: '負債' },
]

const selectedAccountId = shallowRef('')

watch(
  accounts,
  (list) => {
    if (!selectedAccountId.value && list[0]) {
      selectedAccountId.value = list[0].account_id
    }
  },
  { immediate: true },
)

async function addAccount(): Promise<void> {
  if (!accountForm.name.trim()) {
    return
  }

  await appData.addAssetAccount({ name: accountForm.name, kind: accountForm.kind })
  accountForm.name = ''
}

async function recordBalance(): Promise<void> {
  const accountId = selectedAccountId.value || accounts.value[0]?.account_id
  if (!accountId || accountForm.amount <= 0) {
    return
  }

  await appData.addAccountBalance({
    account_id: accountId,
    amount: accountForm.amount,
    date: Date.now(),
  })
  accountForm.amount = 0
}

function signedPercent(value: number): string {
  const rounded = Math.round(value)
  if (rounded > 0) return `+${rounded}%`
  return `${rounded}%`
}

function kindLabel(kind: AccountKind): string {
  return kindOptions.find((option) => option.value === kind)?.label ?? kind
}
</script>

<template>
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">歷史回顧</p>
      <h1 class="mt-1 text-h1 font-bold text-text">從數據看見消費模式</h1>
      <p class="mt-1 text-body-sm text-text-2">
        不只加總流水帳，而是評估結構、趨勢與財務健康，再決定下一步。
      </p>
    </header>

    <div class="grid gap-3">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="item in rangeItems"
          :key="item.value"
          type="button"
          class="min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition"
          :class="
            range === item.value
              ? 'bg-primary text-white'
              : 'border border-border bg-surface text-text-2 hover:text-text'
          "
          @click="selectRange(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <UiDateRangePicker v-if="range === 'custom'" v-model="customRange" label="自訂日期範圍" />
    </div>

    <p v-if="error" class="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{{ error }}</p>

    <div v-if="loading" class="grid gap-4">
      <SkeletonCard :lines="3" />
      <SkeletonCard :lines="4" />
      <SkeletonCard :lines="5" />
    </div>

    <template v-else-if="report">
      <BaseCard variant="primary" class="overflow-hidden">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
              財務健康分數 · {{ report.rangeLabel }}
            </p>
            <p class="mt-1 text-amount-lg font-bold" :class="healthTone">
              {{ report.healthScore }}
            </p>
            <p class="mt-1 text-body-sm text-text-2">
              淨現金流 {{ formatCurrency(report.netCashflow, currency) }}
            </p>
          </div>
          <Sparkles class="size-5 text-primary" aria-hidden="true" />
        </div>
        <p
          v-if="report.insights[0]"
          class="mt-4 rounded-xl bg-surface/80 p-3 text-body-sm text-text"
        >
          {{ report.insights[0].text }}
        </p>
      </BaseCard>

      <section class="grid grid-cols-3 gap-3">
        <BaseCard>
          <p class="text-caption text-text-3">收入</p>
          <p class="mt-1 text-body font-bold text-primary">
            {{ formatCurrency(report.incomeTotal, currency) }}
          </p>
          <p class="mt-1 text-[11px] text-text-3">含固定收入</p>
        </BaseCard>
        <BaseCard>
          <p class="text-caption text-text-3">支出</p>
          <p class="mt-1 text-body font-bold text-danger">
            {{ formatCurrency(report.expenseTotal, currency) }}
          </p>
        </BaseCard>
        <BaseCard>
          <p class="text-caption text-text-3">儲蓄</p>
          <p class="mt-1 text-body font-bold text-text">
            {{ formatCurrency(report.savingTotal, currency) }}
          </p>
        </BaseCard>
      </section>

      <UiTabs v-model="tab" :items="tabItems" />

      <section v-if="tab === 'structure'" class="grid gap-4">
        <BaseCard>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-h3 font-semibold text-text">消費佔比</h2>
          </div>
          <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="item in dimensionItems"
              :key="item.value"
              type="button"
              class="min-h-10 shrink-0 rounded-full px-3 text-sm font-medium"
              :class="
                dimension === item.value
                  ? 'bg-primary text-white'
                  : 'bg-accent text-text-2 hover:text-text'
              "
              @click="dimension = item.value"
            >
              {{ item.label }}
            </button>
          </div>
          <div v-if="slices.length" class="mt-4">
            <DonutChart
              :slices="slices"
              center-label="支出"
              :center-value="formatCurrency(report.expenseTotal, currency)"
            />
            <ul class="mt-4 grid gap-2">
              <li
                v-for="slice in slices.slice(0, 8)"
                :key="slice.key"
                class="flex items-center justify-between rounded-xl bg-accent px-3 py-2"
              >
                <span class="text-body-sm text-text">{{ slice.label }}</span>
                <span class="text-body-sm font-semibold text-text">
                  {{ formatCurrency(slice.amount, currency) }}
                </span>
              </li>
            </ul>
          </div>
          <EmptyState
            v-else
            class="mt-4"
            :icon="Wallet"
            title="這段期間沒有支出"
            message="記幾筆消費後，這裡會依類別、商家或標籤拆解佔比。"
          />
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">必要 vs 想要</h2>
          <p class="mt-1 text-body-sm text-text-2">
            對照 50/30/20：必要 ≤50%、想要 ≤30%、儲蓄 ≥20%。
          </p>
          <div class="mt-4 grid gap-3">
            <div>
              <div class="flex justify-between text-body-sm">
                <span>必要生存支出</span>
                <span class="font-semibold">{{
                  formatPercent(report.needsWants.needsShareOfIncome)
                }}</span>
              </div>
              <div class="mt-2 h-3 overflow-hidden rounded-full bg-border">
                <div
                  class="h-3 rounded-full bg-primary"
                  :style="{
                    width: `${Math.min(report.needsWants.needsShareOfIncome * 100, 100)}%`,
                  }"
                />
              </div>
              <p class="mt-1 text-caption text-text-3">
                {{ report.needsWants.rule50 ? '符合 50% 原則' : '高於建議水位' }} ·
                {{ formatCurrency(report.needsWants.needsAmount, currency) }}
              </p>
            </div>
            <div>
              <div class="flex justify-between text-body-sm">
                <span>彈性慾望消費</span>
                <span class="font-semibold">{{
                  formatPercent(report.needsWants.wantsShareOfIncome)
                }}</span>
              </div>
              <div class="mt-2 h-3 overflow-hidden rounded-full bg-border">
                <div
                  class="h-3 rounded-full bg-warning"
                  :style="{
                    width: `${Math.min(report.needsWants.wantsShareOfIncome * 100, 100)}%`,
                  }"
                />
              </div>
              <p class="mt-1 text-caption text-text-3">
                {{ report.needsWants.rule30 ? '符合 30% 原則' : '想要消費偏高' }} ·
                {{ formatCurrency(report.needsWants.wantsAmount, currency) }}
              </p>
            </div>
            <div>
              <div class="flex justify-between text-body-sm">
                <span>儲蓄</span>
                <span class="font-semibold">{{
                  formatPercent(report.needsWants.savingsShareOfIncome)
                }}</span>
              </div>
              <div class="mt-2 h-3 overflow-hidden rounded-full bg-border">
                <div
                  class="h-3 rounded-full bg-success"
                  :style="{
                    width: `${Math.min(report.needsWants.savingsShareOfIncome * 100, 100)}%`,
                  }"
                />
              </div>
              <p class="mt-1 text-caption text-text-3">
                {{ report.needsWants.rule20 ? '達到 20% 目標' : '儲蓄率偏低' }} ·
                {{ formatCurrency(report.needsWants.savingsAmount, currency) }}
              </p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">固定 vs 變動</h2>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-accent p-3">
              <p class="text-caption text-text-3">固定支出</p>
              <p class="mt-1 text-h3 font-bold text-text">
                {{ formatCurrency(report.fixedVariable.fixedAmount, currency) }}
              </p>
              <p class="mt-1 text-caption text-text-2">
                {{ formatPercent(report.fixedVariable.fixedShare) }} · 調整空間較小
              </p>
            </div>
            <div class="rounded-xl bg-accent p-3">
              <p class="text-caption text-text-3">變動支出</p>
              <p class="mt-1 text-h3 font-bold text-primary">
                {{ formatCurrency(report.fixedVariable.variableAmount, currency) }}
              </p>
              <p class="mt-1 text-caption text-text-2">
                {{ formatPercent(report.fixedVariable.variableShare) }} · 最有彈性
              </p>
            </div>
          </div>
          <ul v-if="report.fixedVariable.adjustableItems.length" class="mt-4 grid gap-2">
            <li
              v-for="item in report.fixedVariable.adjustableItems"
              :key="item.key"
              class="flex items-center justify-between text-body-sm"
            >
              <span class="text-text">{{ item.label }}</span>
              <span class="text-text-2">{{ formatCurrency(item.amount, currency) }}</span>
            </li>
          </ul>
        </BaseCard>
      </section>

      <section v-else-if="tab === 'trend'" class="grid gap-4">
        <BaseCard>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-h3 font-semibold text-text">跨期對比</h2>
            <div class="grid grid-cols-2 gap-1 rounded-xl bg-accent p-1">
              <button
                type="button"
                class="min-h-10 rounded-lg px-3 text-sm font-semibold"
                :class="comparison === 'mom' ? 'bg-surface text-text shadow-sm' : 'text-text-2'"
                @click="comparison = 'mom'"
              >
                環比
              </button>
              <button
                type="button"
                class="min-h-10 rounded-lg px-3 text-sm font-semibold"
                :class="comparison === 'yoy' ? 'bg-surface text-text shadow-sm' : 'text-text-2'"
                @click="comparison = 'yoy'"
              >
                同比
              </button>
            </div>
          </div>
          <p class="mt-2 text-body-sm text-text-2">
            {{ comparisonReport?.currentLabel }} vs {{ comparisonReport?.previousLabel }}
          </p>
          <p
            class="mt-3 text-amount font-bold"
            :class="(comparisonReport?.delta ?? 0) > 0 ? 'text-danger' : 'text-primary'"
          >
            {{ signedPercent(comparisonReport?.deltaPercent ?? 0) }}
          </p>
          <ul class="mt-4 grid gap-2">
            <li
              v-for="mover in comparisonReport?.movers.slice(0, 5)"
              :key="mover.category_id"
              class="flex items-center justify-between rounded-xl border border-border px-3 py-2"
            >
              <span class="text-body-sm font-semibold text-text">{{ mover.name }}</span>
              <span
                class="inline-flex items-center gap-1 text-body-sm font-semibold"
                :class="mover.delta > 0 ? 'text-danger' : 'text-primary'"
              >
                <TrendingUp v-if="mover.delta > 0" class="size-4" />
                <TrendingDown v-else class="size-4" />
                {{ signedPercent(mover.deltaPercent) }}
              </span>
            </li>
          </ul>
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">淨現金流走勢</h2>
          <p class="mt-1 text-body-sm text-text-2">每月收入 − 支出 − 儲蓄</p>
          <TrendLineChart
            class="mt-3"
            :points="report.cashflow.map((point) => ({ label: point.label, value: point.net }))"
            :format-value="(value) => formatCurrency(value, currency)"
            fill
          />
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">季節性高峰</h2>
          <div v-if="report.seasonalPeaks.length" class="mt-4 grid gap-2">
            <div
              v-for="peak in report.seasonalPeaks"
              :key="peak.monthIndex"
              class="rounded-xl bg-accent px-3 py-3"
            >
              <p class="font-semibold text-text">{{ peak.label }} · {{ peak.seasonLabel }}</p>
              <p class="mt-1 text-body-sm text-text-2">
                平均 {{ formatCurrency(peak.averageAmount, currency) }}，高於平常
                {{ Math.round(peak.liftPercent) }}%
              </p>
            </div>
          </div>
          <p v-else class="mt-4 text-body-sm text-text-2">資料還不足以辨識穩定的季節高峰。</p>
        </BaseCard>
      </section>

      <section v-else-if="tab === 'networth'" class="grid gap-4">
        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">淨資產成長</h2>
          <p class="mt-1 text-body-sm text-text-2">
            {{
              report.netWorthIsProxy
                ? '尚未建立帳戶，暫以累積儲蓄作為現金代理。'
                : '資產 − 負債的長期走勢。'
            }}
          </p>
          <TrendLineChart
            class="mt-3"
            :points="
              report.netWorth.map((point) => ({ label: point.label, value: point.netWorth }))
            "
            color="var(--color-success)"
            :format-value="(value) => formatCurrency(value, currency)"
            fill
          />
          <p v-if="report.netWorth.at(-1)" class="mt-2 text-body-sm text-text-2">
            目前淨值 {{ formatCurrency(report.netWorth.at(-1)?.netWorth ?? 0, currency) }}
          </p>
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">資產配置推移</h2>
          <div class="mt-4 grid gap-3">
            <div v-for="point in report.allocation.slice(-6)" :key="point.monthKey">
              <p class="text-caption text-text-3">{{ point.label }}</p>
              <div class="mt-1 flex h-3 overflow-hidden rounded-full">
                <span class="bg-primary" :style="{ width: `${point.cashShare * 100}%` }" />
                <span class="bg-success" :style="{ width: `${point.investmentShare * 100}%` }" />
                <span class="bg-danger" :style="{ width: `${point.liabilityShare * 100}%` }" />
              </div>
            </div>
            <p class="text-caption text-text-3">紫＝現金 · 綠＝投資 · 紅＝負債</p>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-center gap-2">
            <Landmark class="size-5 text-primary" />
            <h2 class="text-h3 font-semibold text-text">帳戶與餘額</h2>
          </div>
          <ul v-if="accounts.length" class="mt-4 grid gap-2">
            <li
              v-for="account in accounts"
              :key="account.account_id"
              class="flex items-center justify-between rounded-xl border border-border px-3 py-2"
            >
              <div>
                <p class="text-body-sm font-semibold text-text">{{ account.name }}</p>
                <p class="text-caption text-text-3">{{ kindLabel(account.kind) }}</p>
              </div>
            </li>
          </ul>
          <div class="mt-4 grid gap-3">
            <BaseInput v-model="accountForm.name" label="帳戶名稱" placeholder="例如：HSBC 儲蓄" />
            <UiSelect v-model="accountForm.kind" label="類型" :options="kindOptions" />
            <BaseButton type="button" @click="addAccount">新增帳戶</BaseButton>
            <template v-if="accounts.length">
              <UiSelect
                v-model="selectedAccountId"
                label="記錄餘額"
                :options="
                  accounts.map((account) => ({ value: account.account_id, label: account.name }))
                "
              />
              <UiNumberField v-model="accountForm.amount" label="目前餘額" :min="0" :step="1" />
              <BaseButton variant="secondary" type="button" @click="recordBalance">
                記錄這一刻的餘額
              </BaseButton>
            </template>
          </div>
        </BaseCard>
      </section>

      <section v-else-if="tab === 'health'" class="grid gap-4">
        <BaseCard>
          <div class="flex items-center gap-2">
            <PiggyBank class="size-5 text-primary" />
            <h2 class="text-h3 font-semibold text-text">儲蓄率與緊急預備金</h2>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-accent p-3">
              <p class="text-caption text-text-3">長期平均儲蓄率</p>
              <p class="mt-1 text-amount font-bold text-text">
                {{ formatPercent(report.savingsHealth.averageSavingsRate) }}
              </p>
            </div>
            <div class="rounded-xl bg-accent p-3">
              <p class="text-caption text-text-3">可支撐月數</p>
              <p class="mt-1 text-amount font-bold text-text">
                {{ report.savingsHealth.emergencyMonths.toFixed(1) }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-body-sm text-text-2">
            以歷史平均月支出
            {{
              formatCurrency(report.savingsHealth.averageMonthlyExpense, currency)
            }}
            估算，流動資金約 {{ formatCurrency(report.savingsHealth.liquidBuffer, currency) }}。
          </p>
        </BaseCard>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">預算差異</h2>
          <div
            v-if="report.chronicOverspend.length"
            class="mt-3 rounded-xl bg-danger/5 p-3 text-body-sm text-danger"
          >
            經常超支：
            {{
              report.chronicOverspend
                .map((item) => `${item.name}（${item.months} 個週期）`)
                .join('、')
            }}
          </div>
          <ul class="mt-4 grid gap-2">
            <li
              v-for="row in report.budgetVariance.slice(0, 8)"
              :key="`${row.cycleCode}-${row.category_id}`"
              class="flex items-center justify-between text-body-sm"
            >
              <span class="text-text">{{ row.categoryName }}</span>
              <span :class="row.overspent ? 'font-semibold text-danger' : 'text-text-2'">
                {{ formatPercent(row.attainment) }}
              </span>
            </li>
          </ul>
          <p v-if="!report.budgetVariance.length" class="mt-4 text-body-sm text-text-2">
            設定分類預算後，這裡會顯示各月達成率。
          </p>
        </BaseCard>

        <BaseCard>
          <div class="flex items-center gap-2">
            <AlertTriangle class="size-5 text-warning" />
            <h2 class="text-h3 font-semibold text-text">異常大額支出</h2>
          </div>
          <p class="mt-1 text-body-sm text-text-2">
            已從日常分析中隔離，避免買家電這類事件扭曲平均值。
          </p>
          <ul v-if="report.outliers.length" class="mt-4 grid gap-2">
            <li
              v-for="item in report.outliers"
              :key="item.id"
              class="rounded-xl border border-border px-3 py-2"
            >
              <div class="flex items-center justify-between">
                <p class="font-semibold text-text">{{ item.name }}</p>
                <p class="font-semibold text-danger">{{ formatCurrency(item.amount, currency) }}</p>
              </div>
              <p class="mt-1 text-caption text-text-3">
                {{ item.categoryName }} · {{ formatDate(item.date) }} · 約為中位數
                {{ item.multiplier.toFixed(1) }} 倍
              </p>
            </li>
          </ul>
          <p v-else class="mt-4 text-body-sm text-text-2">這段期間沒有明顯偏離常態的大額消費。</p>
        </BaseCard>
      </section>

      <section v-else class="grid gap-4">
        <div class="grid grid-cols-2 gap-1 rounded-xl bg-accent p-1">
          <button
            type="button"
            class="min-h-11 rounded-lg text-sm font-semibold"
            :class="wrappedKind === 'year' ? 'bg-surface text-text shadow-sm' : 'text-text-2'"
            @click="wrappedKind = 'year'"
          >
            年報
          </button>
          <button
            type="button"
            class="min-h-11 rounded-lg text-sm font-semibold"
            :class="wrappedKind === 'month' ? 'bg-surface text-text shadow-sm' : 'text-text-2'"
            @click="wrappedKind = 'month'"
          >
            月報
          </button>
        </div>

        <article v-if="wrapped" class="wrapped-card rounded-3xl p-5 text-white">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Financial Wrapped
          </p>
          <h2 class="mt-2 text-2xl font-bold">{{ wrapped.periodLabel }}</h2>
          <p class="mt-6 text-sm text-white/70">總收入</p>
          <p class="text-3xl font-bold">{{ formatCurrency(wrapped.incomeTotal, currency) }}</p>
          <div class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-white/70">最大單筆</p>
              <p class="mt-1 font-semibold">{{ wrapped.largestExpense?.name ?? '—' }}</p>
              <p class="text-sm text-white/80">
                {{
                  wrapped.largestExpense
                    ? formatCurrency(wrapped.largestExpense.amount, currency)
                    : ''
                }}
              </p>
            </div>
            <div>
              <p class="text-xs text-white/70">最常消費</p>
              <p class="mt-1 font-semibold">{{ wrapped.topMerchant?.name ?? '—' }}</p>
              <p class="text-sm text-white/80">
                {{ wrapped.topMerchant ? `${wrapped.topMerchant.count} 次` : '' }}
              </p>
            </div>
          </div>
          <p class="mt-6 rounded-2xl bg-white/12 p-3 text-sm">{{ wrapped.milestone }}</p>
        </article>

        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">自動化洞察</h2>
          <ul class="mt-4 grid gap-3">
            <li
              v-for="insight in report.insights"
              :key="insight.id"
              class="rounded-xl px-3 py-3 text-body-sm"
              :class="{
                'bg-accent text-text': insight.tone === 'info',
                'bg-warning/10 text-text': insight.tone === 'warning',
                'bg-success/10 text-text': insight.tone === 'success',
              }"
            >
              {{ insight.text }}
            </li>
          </ul>
        </BaseCard>
      </section>
    </template>
  </div>
</template>

<style scoped>
.wrapped-card {
  background:
    radial-gradient(circle at 88% 12%, rgb(255 255 255 / 18%), transparent 28%),
    linear-gradient(160deg, #5b21b6 0%, #7c3aed 48%, #0f766e 100%);
  box-shadow: 0 18px 40px rgb(91 33 182 / 22%);
}
</style>
