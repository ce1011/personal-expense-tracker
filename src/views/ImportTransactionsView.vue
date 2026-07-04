<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue'
import { Braces, CheckCircle2, CircleAlert, Copy, Upload } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { useAppData } from '@/composables/useAppData'
import { buildAiImportPrompt } from '@/lib/aiImportPrompt'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  parseTransactionImportJson,
  type ImportPreviewSummary,
  type ImportTransactionRecord,
} from '@/lib/transactionImport'
import { savingCategories } from '@/lib/savingCategories'

const appData = useAppData()
const jsonText = shallowRef('')
const importErrors = shallowRef<string[]>([])
const previewTransactions = shallowRef<ImportTransactionRecord[]>([])
const previewSummary = shallowRef<ImportPreviewSummary | undefined>(undefined)
const statusMessage = shallowRef('')
const promptStatus = shallowRef('')
const isImporting = shallowRef(false)
const previewSection = useTemplateRef<HTMLElement>('previewSection')
const resultSection = useTemplateRef<HTMLElement>('resultSection')

const exampleJson = computed(() =>
  JSON.stringify(
    [
      {
        type: 'expense',
        category_id: appData.activeExpenseCategories.value[0]?.category_id ?? 'expense-food',
        name: '午餐',
        amount: 58,
        date: Date.now(),
        currency_code: 'HKD',
      },
      {
        type: 'income',
        category_id: appData.activeIncomeCategories.value[0]?.category_id ?? 'income-salary',
        name: '薪金',
        amount: 1000,
        date: Date.now(),
        currency_code: 'CNY',
      },
      {
        type: 'saving',
        category_id: 'saving-stocks',
        name: '買 VOO',
        amount: 300,
        date: Date.now(),
        currency_code: 'USD',
      },
    ],
    null,
    2,
  ),
)

const categoryLabelMap = computed(() => {
  const pairs = [
    ...appData.activeExpenseCategories.value,
    ...appData.activeIncomeCategories.value,
    ...savingCategories,
  ].map((category) => [category.category_id, category.name_tc || category.name_en] as const)
  return new Map(pairs)
})

const previewRows = computed(() =>
  previewTransactions.value.slice(0, 12).map((transaction) => ({
    ...transaction,
    categoryLabel: categoryLabelMap.value.get(transaction.category_id) ?? transaction.category_id,
    convertedAmount: transaction.amount * transaction.exchange_rate_hkd,
  })),
)

const amountSummary = computed(() => {
  const groups = {
    expense: { count: 0, originalTotal: 0, hkdTotal: 0 },
    income: { count: 0, originalTotal: 0, hkdTotal: 0 },
    saving: { count: 0, originalTotal: 0, hkdTotal: 0 },
  }

  for (const transaction of previewTransactions.value) {
    const target = groups[transaction.type]
    target.count += 1
    target.originalTotal += transaction.amount
    target.hkdTotal += transaction.amount * transaction.exchange_rate_hkd
  }

  return groups
})

const aiPrompt = computed(() =>
  buildAiImportPrompt({
    expenseCategories: appData.activeExpenseCategories.value,
    incomeCategories: appData.activeIncomeCategories.value,
    savingCategories,
  }),
)

async function validatePreview(): Promise<void> {
  statusMessage.value = ''

  const result = parseTransactionImportJson(jsonText.value, {
    expenseCategories: appData.activeExpenseCategories.value,
    incomeCategories: appData.activeIncomeCategories.value,
    fxRateMap: appData.fxRateMap.value,
  })

  importErrors.value = result.errors
  previewTransactions.value = result.transactions
  previewSummary.value = result.summary

  if (result.errors.length === 0) {
    statusMessage.value = `驗證成功，可匯入 ${result.transactions.length} 筆交易。`
  }

  await nextTick()
  scrollToResult()
}

async function confirmImport(): Promise<void> {
  if (previewTransactions.value.length === 0 || importErrors.value.length > 0) {
    return
  }

  isImporting.value = true
  statusMessage.value = ''

  const activeTripId = appData.activeTripId.value || undefined
  const recordsToImport = previewTransactions.value.map((record) => ({
    ...record,
    trip_id: activeTripId,
  }))

  try {
    await appData.importTransactions(recordsToImport)
    statusMessage.value = `已成功匯入 ${previewTransactions.value.length} 筆交易。`
    jsonText.value = ''
    previewTransactions.value = []
    previewSummary.value = undefined
    importErrors.value = []
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : '匯入失敗，請稍後再試。'
  } finally {
    isImporting.value = false
  }
}

function loadExample(): void {
  jsonText.value = exampleJson.value
  statusMessage.value = ''
  importErrors.value = []
  previewTransactions.value = []
  previewSummary.value = undefined
}

async function copyAiPrompt(): Promise<void> {
  promptStatus.value = ''

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(aiPrompt.value)
    } else {
      copyTextFallback(aiPrompt.value)
    }

    promptStatus.value = 'AI Prompt 已複製，可直接貼到 AI 對話中配合圖片使用。'
  } catch {
    promptStatus.value = '複製失敗，請稍後再試。'
  }
}

function scrollToResult(): void {
  const target = importErrors.value.length > 0 ? resultSection.value : previewSection.value
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function typeLabel(type: ImportTransactionRecord['type']): string {
  if (type === 'expense') {
    return '支出'
  }

  if (type === 'income') {
    return '收入'
  }

  return '儲蓄'
}

function typeTone(type: ImportTransactionRecord['type']): string {
  if (type === 'expense') {
    return 'bg-danger/10 text-danger'
  }

  if (type === 'income') {
    return 'bg-primary/10 text-primary'
  }

  return 'bg-warning/10 text-warning'
}

function copyTextFallback(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
</script>

<template>
  <div class="grid gap-4">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">批量匯入</p>
        <h1 class="mt-1 text-h1 font-bold text-text">JSON 匯入交易</h1>
        <p class="mt-1 max-w-3xl text-body-sm text-text-2">
          貼上一段交易陣列 JSON，先驗證、先預覽，再一次匯入。支援支出、收入與儲蓄三種交易類型。
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <BaseButton variant="secondary" @click="copyAiPrompt">
          <Copy class="size-4" aria-hidden="true" />
          複製 AI Prompt
        </BaseButton>
        <BaseButton variant="secondary" @click="loadExample">
          <Braces class="size-4" aria-hidden="true" />
          載入範例 JSON
        </BaseButton>
      </div>
    </header>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <BaseCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-h3 font-semibold text-text">貼上 JSON</h2>
            <p class="text-body-sm text-text-2">
              必須是交易陣列，每筆包含 type、category_id、name、amount、date、currency_code。
            </p>
          </div>
          <Upload class="size-5 text-primary" aria-hidden="true" />
        </div>

        <textarea
          v-model="jsonText"
          rows="16"
          class="mt-4 w-full rounded-xl border border-border bg-surface px-3 py-3 font-mono text-xs leading-6 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder='[{"type":"expense","category_id":"expense-food","name":"午餐","amount":58,"date":1780070400000,"currency_code":"HKD"}]'
        />

        <div class="mt-4 flex flex-wrap gap-2">
          <BaseButton :disabled="!jsonText.trim()" @click="validatePreview">驗證與預覽</BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="previewTransactions.length === 0 || importErrors.length > 0 || isImporting"
            @click="confirmImport"
          >
            {{ isImporting ? '匯入中…' : '確認匯入' }}
          </BaseButton>
        </div>
      </BaseCard>

      <div class="grid gap-4">
        <BaseCard>
          <h2 class="text-h3 font-semibold text-text">格式說明</h2>
          <p class="text-body-sm text-text-2">
            可先複製上方 AI Prompt，連同圖片交給 AI 產生批量匯入 JSON，再貼回這個頁面驗證。
          </p>
          <ul class="mt-3 grid gap-2 text-body-sm text-text-2">
            <li>
              <span class="font-semibold text-text">type</span>: `expense` / `income` / `saving`
            </li>
            <li><span class="font-semibold text-text">date</span>: 毫秒 Unix timestamp</li>
            <li>
              <span class="font-semibold text-text">currency_code</span>: `HKD/USD/CNY/JPY/TWD/THB`
            </li>
            <li>
              <span class="font-semibold text-text">exchange_rate_hkd</span>: 可省略，會改用 app
              目前快取匯率
            </li>
            <li>
              <span class="font-semibold text-text">saving 類別</span>: `saving-cash` /
              `saving-time-deposit` / `saving-stocks`
            </li>
          </ul>
        </BaseCard>

        <BaseCard ref="previewSection">
          <h2 class="text-h3 font-semibold text-text">預覽摘要</h2>

          <div v-if="previewSummary" class="mt-4 grid gap-3 sm:grid-cols-2">
            <BaseCard variant="primary">
              <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                總筆數
              </p>
              <p class="mt-1 text-amount font-bold text-text">{{ previewSummary.total }}</p>
            </BaseCard>
            <BaseCard>
              <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">幣別</p>
              <p class="mt-1 text-body-sm font-semibold text-text">
                {{ previewSummary.currencies.join('、') }}
              </p>
            </BaseCard>
            <BaseCard>
              <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                支出 / 收入 / 儲蓄
              </p>
              <p class="mt-1 text-body-sm font-semibold text-text">
                {{ previewSummary.expenseCount }} / {{ previewSummary.incomeCount }} /
                {{ previewSummary.savingCount }}
              </p>
            </BaseCard>
            <BaseCard>
              <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                匯入策略
              </p>
              <p class="mt-1 text-body-sm font-semibold text-text">全有或全無</p>
            </BaseCard>
          </div>

          <div v-if="previewSummary" class="mt-4 grid gap-3">
            <BaseCard>
              <h3 class="text-body-sm font-semibold text-text">按交易類型金額摘要</h3>
              <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <BaseCard variant="danger">
                  <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                    支出
                  </p>
                  <p class="mt-1 text-body-sm font-semibold text-text">
                    {{ amountSummary.expense.count }} 筆
                  </p>
                  <p class="mt-1 text-caption text-text-2">
                    原幣合計 {{ amountSummary.expense.originalTotal.toFixed(2) }}
                  </p>
                  <p class="text-caption text-text-2">
                    預計入帳 {{ formatCurrency(amountSummary.expense.hkdTotal, 'HKD') }}
                  </p>
                </BaseCard>
                <BaseCard variant="primary">
                  <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                    收入
                  </p>
                  <p class="mt-1 text-body-sm font-semibold text-text">
                    {{ amountSummary.income.count }} 筆
                  </p>
                  <p class="mt-1 text-caption text-text-2">
                    原幣合計 {{ amountSummary.income.originalTotal.toFixed(2) }}
                  </p>
                  <p class="text-caption text-text-2">
                    預計入帳 {{ formatCurrency(amountSummary.income.hkdTotal, 'HKD') }}
                  </p>
                </BaseCard>
                <BaseCard variant="warning">
                  <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
                    儲蓄
                  </p>
                  <p class="mt-1 text-body-sm font-semibold text-text">
                    {{ amountSummary.saving.count }} 筆
                  </p>
                  <p class="mt-1 text-caption text-text-2">
                    原幣合計 {{ amountSummary.saving.originalTotal.toFixed(2) }}
                  </p>
                  <p class="text-caption text-text-2">
                    預計入帳 {{ formatCurrency(amountSummary.saving.hkdTotal, 'HKD') }}
                  </p>
                </BaseCard>
              </div>
            </BaseCard>

            <BaseCard>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-body-sm font-semibold text-text">逐筆預覽</h3>
                <p class="text-caption text-text-3">預設顯示前 {{ previewRows.length }} 筆</p>
              </div>

              <div class="mt-3 grid gap-3">
                <div
                  v-for="row in previewRows"
                  :key="`${row.type}-${row.category_id}-${row.name}-${row.date}-${row.amount}`"
                  class="rounded-xl border border-border bg-surface p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-semibold"
                          :class="typeTone(row.type)"
                        >
                          {{ typeLabel(row.type) }}
                        </span>
                        <span class="text-body-sm font-semibold text-text">{{ row.name }}</span>
                      </div>
                      <p class="mt-1 text-caption text-text-2">
                        {{ row.categoryLabel }} · {{ formatDate(row.date) }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-body-sm font-semibold text-text">
                        {{ row.currency_code }} {{ row.amount.toFixed(2) }}
                      </p>
                      <p class="text-caption text-text-2">
                        ≈ {{ formatCurrency(row.convertedAmount, 'HKD') }}
                      </p>
                    </div>
                  </div>
                  <p class="mt-2 text-caption text-text-2">
                    匯率 {{ row.exchange_rate_hkd.toFixed(4) }}
                  </p>
                </div>
              </div>

              <p
                v-if="previewTransactions.length > previewRows.length"
                class="mt-2 text-caption text-text-2"
              >
                尚有
                {{ previewTransactions.length - previewRows.length }} 筆未展開，匯入時仍會一併處理。
              </p>
            </BaseCard>
          </div>

          <EmptyState
            v-else
            class="mt-4"
            :icon="Upload"
            title="尚未產生預覽"
            message="貼上 JSON 後先按「驗證與預覽」，這裡會顯示匯入摘要。"
          />
        </BaseCard>
      </div>
    </div>

    <BaseCard v-if="promptStatus" variant="primary" class="border border-primary/20">
      <p class="text-body-sm font-medium text-primary">{{ promptStatus }}</p>
    </BaseCard>

    <BaseCard
      v-if="importErrors.length"
      ref="resultSection"
      variant="danger"
      class="border border-danger/20"
    >
      <div class="flex items-start gap-3">
        <CircleAlert class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h2 class="text-h3 font-semibold text-text">驗證失敗</h2>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-body-sm text-text-2">
            <li v-for="error in importErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </BaseCard>

    <BaseCard
      v-else-if="previewTransactions.length"
      ref="resultSection"
      variant="primary"
      class="border border-primary/20"
    >
      <div class="flex items-start gap-3">
        <CheckCircle2 class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 class="text-h3 font-semibold text-text">驗證成功</h2>
          <p class="mt-1 text-body-sm text-text-2">
            可以匯入
            {{ previewTransactions.length }} 筆交易。確認後會一次寫入支出、收入與儲蓄資料表。
          </p>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="statusMessage" class="border border-border">
      <p class="text-body-sm font-medium text-text">{{ statusMessage }}</p>
    </BaseCard>
  </div>
</template>
