<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { CirclePlus, PencilLine, Trash2 } from 'lucide-vue-next'

import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import { convertToHkd } from '@/lib/fx'
import { formatCurrency } from '@/lib/formatters'
import { savingCategories } from '@/lib/savingCategories'
import type {
  CombinedTransaction,
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SavingDraft,
  SupportedCurrency,
  TransactionKind,
} from '@/types/app-data'
import type { SavingCategoryOption } from '@/lib/savingCategories'

const props = defineProps<{
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate?: string
  compact?: boolean
  transaction?: CombinedTransaction
}>()

const emit = defineEmits<{
  createExpense: [draft: ExpenseDraft]
  createIncome: [draft: IncomeDraft]
  createSaving: [draft: SavingDraft]
  updateExpense: [transactionId: string, draft: ExpenseDraft]
  updateIncome: [transactionId: string, draft: IncomeDraft]
  updateSaving: [transactionId: string, draft: SavingDraft]
  deleteTransaction: []
  cancelEdit: []
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
const isEditing = computed(() => Boolean(props.transaction))
const categories = computed<readonly (ExpenseCategory | IncomeCategory | SavingCategoryOption)[]>(() =>
  form.kind === 'expense'
    ? props.expenseCategories
    : form.kind === 'income'
      ? props.incomeCategories
      : savingCategories,
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
  () => props.transaction,
  (transaction) => {
    if (!transaction) {
      resetForm()
      return
    }

    form.kind = transaction.kind
    form.category_id = transaction.category_id
    form.name = transaction.name
    form.amount = transaction.original_amount ?? transaction.amount
    form.currency_code = transaction.original_currency ?? 'HKD'
    form.date = toDateInputValue(transaction.date)
  },
  { immediate: true },
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
    if (props.transaction) {
      emit('updateExpense', props.transaction.id, draft)
    } else {
      emit('createExpense', draft)
    }
  } else if (form.kind === 'income') {
    if (props.transaction) {
      emit('updateIncome', props.transaction.id, draft)
    } else {
      emit('createIncome', draft)
    }
  } else {
    if (props.transaction) {
      emit('updateSaving', props.transaction.id, draft)
    } else {
      emit('createSaving', draft)
    }
  }

  if (!props.transaction) {
    form.name = ''
    form.amount = 0
  }
}

function resetForm(): void {
  form.kind = 'expense'
  form.category_id = ''
  form.name = ''
  form.amount = 0
  form.currency_code = 'HKD'
  form.date = toDateInputValue(Date.now())
}

function cancelEdit(): void {
  emit('cancelEdit')
}

function removeTransaction(): void {
  if (!props.transaction) {
    return
  }

  emit('deleteTransaction')
}
</script>

<template>
  <form class="rounded-md border border-stone-200 bg-white p-4 shadow-sm" @submit.prevent="submitForm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-stone-950">
          {{ isEditing ? '修改交易' : compact ? '快速記一筆' : '新增交易' }}
        </p>
        <p class="text-xs text-stone-500">
          {{ isEditing ? '修改後會覆蓋原有紀錄，交易類型會保持不變。' : '支出、收入與儲蓄都會先按原幣輸入，再自動換算成港幣入帳。' }}
        </p>
      </div>
      <CirclePlus v-if="!isEditing" class="size-5 text-emerald-800" aria-hidden="true" />
      <PencilLine v-else class="size-5 text-amber-700" aria-hidden="true" />
    </div>

    <div class="mt-4 grid gap-3" :class="compact ? 'md:grid-cols-2' : 'md:grid-cols-6'">
      <div class="grid gap-1 text-sm font-medium text-stone-700">
        <span>類型</span>
        <template v-if="isEditing">
          <div class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700">
            {{ form.kind === 'expense' ? '支出' : form.kind === 'income' ? '收入' : '儲蓄' }}
          </div>
        </template>
        <select v-else v-model="form.kind" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option value="expense">支出</option>
          <option value="income">收入</option>
          <option value="saving">儲蓄</option>
        </select>
      </div>

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
        <input
          v-model.trim="form.name"
          class="rounded-md border border-stone-300 px-3 py-2"
          placeholder="例如：午餐、MTR、薪金、買股票"
        />
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

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        class="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-300"
        :disabled="!canSubmit"
      >
        {{ isEditing ? '儲存修改' : '新增交易' }}
      </button>
      <button
        v-if="isEditing"
        type="button"
        class="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        @click="cancelEdit"
      >
        取消
      </button>
      <button
        v-if="isEditing"
        type="button"
        class="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        @click="removeTransaction"
      >
        <Trash2 class="size-4" aria-hidden="true" />
        刪除
      </button>
    </div>
  </form>
</template>
