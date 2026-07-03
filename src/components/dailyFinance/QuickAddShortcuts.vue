<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import {
  calculateSpareChange,
  parseQuickAddText,
  type QuickAddSuggestion,
} from '@/lib/dailyFinance/quickAdd'
import { formatCurrency } from '@/lib/formatters'
import { savingCategories } from '@/lib/savingCategories'
import type {
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SavingDraft,
  SupportedCurrency,
} from '@/types/app-data'

const props = defineProps<{
  suggestions: readonly QuickAddSuggestion[]
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  currency: string
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
}>()

const emit = defineEmits<{
  createExpense: [draft: ExpenseDraft]
  createIncome: [draft: IncomeDraft]
  createSaving: [draft: SavingDraft]
}>()

const text = shallowRef('')
const isSpareChangeEnabled = shallowRef(false)

const allCategories = computed(() => [
  ...props.expenseCategories,
  ...props.incomeCategories,
  ...savingCategories,
])

const parsed = computed(() => parseQuickAddText(text.value, allCategories.value))

const selectedRate = computed(
  () => props.fxRateMap.get((props.currency as SupportedCurrency) ?? 'HKD') ?? 0,
)

const transactionKind = computed(() => {
  if (!parsed.value?.category_id) {
    return 'expense'
  }

  if (
    props.incomeCategories.some((category) => category.category_id === parsed.value?.category_id)
  ) {
    return 'income'
  }

  if (savingCategories.some((category) => category.category_id === parsed.value?.category_id)) {
    return 'saving'
  }

  return 'expense'
})

const canSubmit = computed(() => {
  if (!parsed.value) {
    return false
  }

  return parsed.value.amount > 0 && selectedRate.value > 0
})

const spareChange = computed(() => {
  if (!parsed.value || transactionKind.value !== 'expense') {
    return null
  }

  return calculateSpareChange(parsed.value.amount)
})

function applySuggestion(suggestion: QuickAddSuggestion): void {
  text.value = `${suggestion.name} `
  isSpareChangeEnabled.value = false
}

function submit(): void {
  if (!parsed.value || !canSubmit.value) {
    return
  }

  const baseDraft = {
    category_id: parsed.value.category_id ?? props.expenseCategories[0]?.category_id ?? '',
    name: parsed.value.name,
    amount: parsed.value.amount,
    date: Date.now(),
    currency_code: (props.currency as SupportedCurrency) ?? 'HKD',
    exchange_rate_hkd: selectedRate.value,
  }

  if (transactionKind.value === 'income') {
    emit('createIncome', baseDraft)
  } else if (transactionKind.value === 'saving') {
    emit('createSaving', { ...baseDraft, challenge_id: undefined })
  } else {
    const finalAmount =
      isSpareChangeEnabled.value && spareChange.value
        ? spareChange.value.roundedAmount
        : parsed.value.amount

    emit('createExpense', {
      ...baseDraft,
      amount: finalAmount,
      recurring: false,
      recurring_frequency: undefined,
      recurring_day: undefined,
    })

    if (isSpareChangeEnabled.value && spareChange.value && spareChange.value.spareChange > 0) {
      emit('createSaving', {
        ...baseDraft,
        category_id: savingCategories[0]?.category_id ?? '',
        name: '零頭儲蓄',
        amount: spareChange.value.spareChange,
        challenge_id: undefined,
      })
    }
  }

  text.value = ''
  isSpareChangeEnabled.value = false
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4">
      <h2 class="text-base font-semibold text-stone-950">快速新增</h2>
      <p class="mt-1 text-sm text-stone-500">輸入「名稱 金額」快速記帳，或點選常用捷徑</p>
    </div>

    <div v-if="suggestions.length" class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="`${suggestion.kind}-${suggestion.category_id}-${suggestion.name}`"
        type="button"
        class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 transition hover:border-emerald-800 hover:text-emerald-800"
        @click="applySuggestion(suggestion)"
      >
        {{ suggestion.name }}
      </button>
    </div>

    <form class="space-y-3" @submit.prevent="submit">
      <div class="flex gap-2">
        <input
          v-model="text"
          type="text"
          class="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-800 focus:outline-none"
          placeholder="例如：麥當勞 55"
        />
        <button
          type="submit"
          class="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
          :disabled="!canSubmit"
        >
          新增
        </button>
      </div>

      <div v-if="parsed" class="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
        <p>
          識別：{{ parsed.name }} · {{ formatCurrency(parsed.amount, currency) }}
          <span v-if="parsed.category_id" class="ml-1 text-emerald-700">（已配對分類）</span>
        </p>
      </div>

      <label
        v-if="spareChange && spareChange.spareChange > 0"
        class="flex items-center gap-2 text-sm font-medium text-stone-700"
      >
        <input
          v-model="isSpareChangeEnabled"
          type="checkbox"
          class="size-4 rounded border-stone-300"
        />
        零頭儲蓄：入帳 {{ formatCurrency(spareChange.roundedAmount, currency) }}，儲蓄
        {{ formatCurrency(spareChange.spareChange, currency) }}
      </label>
    </form>
  </article>
</template>
