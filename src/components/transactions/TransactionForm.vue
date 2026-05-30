<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { CirclePlus } from 'lucide-vue-next'

import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import { convertToHkd } from '@/lib/fx'
import { formatCurrency } from '@/lib/formatters'
import type {
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SupportedCurrency,
  TransactionKind,
} from '@/types/app-data'

const props = defineProps<{
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate?: string
  compact?: boolean
}>()

const emit = defineEmits<{
  createExpense: [draft: ExpenseDraft]
  createIncome: [draft: IncomeDraft]
}>()

const form = reactive({
  kind: 'expense' as TransactionKind,
  category_id: '',
  name: '',
  amount: 0,
  currency_code: 'HKD' as SupportedCurrency,
  date: toDateInputValue(Date.now()),
})

const supportedCurrencies: SupportedCurrency[] = ['HKD', 'USD', 'CNY', 'JPY', 'TWD', 'THB']
const categories = computed(() =>
  form.kind === 'expense' ? props.expenseCategories : props.incomeCategories,
)
const selectedRate = computed(() => props.fxRateMap.get(form.currency_code) ?? 0)
const convertedAmount = computed(() =>
  selectedRate.value > 0 ? convertToHkd(Number(form.amount || 0), selectedRate.value) : 0,
)
const canSubmit = computed(
  () =>
    form.category_id !== '' &&
    form.name.trim() !== '' &&
    Number(form.amount) > 0 &&
    selectedRate.value > 0,
)

watch(
  categories,
  (nextCategories) => {
    if (!nextCategories.some((category) => category.category_id === form.category_id)) {
      form.category_id = nextCategories[0]?.category_id ?? ''
    }
  },
  { immediate: true },
)

function submitForm(): void {
  if (!canSubmit.value) {
    return
  }

  const draft = {
    category_id: form.category_id,
    name: form.name,
    amount: Number(form.amount),
    date: fromDateInputValue(form.date),
    currency_code: form.currency_code,
    exchange_rate_hkd: selectedRate.value,
  }

  if (form.kind === 'expense') {
    emit('createExpense', draft)
  } else {
    emit('createIncome', draft)
  }

  form.name = ''
  form.amount = 0
}
</script>

<template>
  <form class="rounded-md border border-stone-200 bg-white p-4 shadow-sm" @submit.prevent="submitForm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-stone-950">{{ compact ? '快速記一筆' : '新增交易' }}</p>
        <p class="text-xs text-stone-500">輸入原幣金額後會自動換算成港幣入帳。</p>
      </div>
      <CirclePlus class="size-5 text-emerald-800" aria-hidden="true" />
    </div>

    <div class="mt-4 grid gap-3" :class="compact ? 'md:grid-cols-2' : 'md:grid-cols-6'">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        類型
        <select v-model="form.kind" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        分類
        <select v-model="form.category_id" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
            {{ category.name_tc || category.name_en }}
          </option>
        </select>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        名稱
        <input v-model.trim="form.name" class="rounded-md border border-stone-300 px-3 py-2" placeholder="例如：午餐、MTR、薪金" />
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        幣別
        <select v-model="form.currency_code" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option v-for="currencyCode in supportedCurrencies" :key="currencyCode" :value="currencyCode">
            {{ currencyCode }}
          </option>
        </select>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        原幣金額
        <input v-model.number="form.amount" min="0" step="0.01" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        日期
        <input v-model="form.date" type="date" class="rounded-md border border-stone-300 px-3 py-2" />
      </label>
    </div>

    <div class="mt-3 rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
      <p>
        以 {{ form.currency_code }} 兌港幣匯率 {{ selectedRate || '-' }} 計，
        將入帳 {{ formatCurrency(convertedAmount, 'HKD') }}
      </p>
      <p class="mt-1 text-xs text-stone-500">
        匯率日期：{{ latestFxDate || '尚未取得' }}
      </p>
    </div>

    <button
      type="submit"
      class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-300"
      :disabled="!canSubmit"
    >
      新增交易
    </button>
  </form>
</template>
