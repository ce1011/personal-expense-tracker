<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import UiCheckbox from '@/components/ui/UiCheckbox.vue'
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

const categoryHint = computed(() => {
  if (!parsed.value || parsed.value.category_id) {
    return ''
  }

  return '未偵測到分類，將使用預設支出分類'
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
  <BaseCard>
    <div class="mb-4">
      <h2 class="text-base font-semibold text-text">快速新增</h2>
      <p class="mt-1 text-sm text-text-2">輸入「名稱 金額」快速記帳，或點選常用捷徑</p>
    </div>

    <div v-if="suggestions.length" class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="`${suggestion.kind}-${suggestion.category_id}-${suggestion.name}`"
        type="button"
        class="rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary hover:text-primary"
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
          class="input-base flex-1 text-base"
          :class="
            !parsed
              ? ''
              : parsed.category_id
                ? 'border-primary'
                : 'border-warning focus:border-warning focus:ring-warning/20'
          "
          placeholder="例如：麥當勞 55"
        />
        <button
          type="submit"
          class="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-2 disabled:opacity-50"
          :disabled="!canSubmit"
        >
          新增
        </button>
      </div>

      <div v-if="parsed" class="rounded-xl bg-accent px-3 py-2 text-sm text-text-2">
        <p>
          識別：{{ parsed.name }} · {{ formatCurrency(parsed.amount, currency) }}
          <span v-if="parsed.category_id" class="ml-1 text-primary">（已配對分類）</span>
        </p>
        <p v-if="categoryHint" class="mt-1 text-warning">{{ categoryHint }}</p>
      </div>

      <UiCheckbox v-if="spareChange && spareChange.spareChange > 0" v-model="isSpareChangeEnabled">
        零頭儲蓄：入帳 {{ formatCurrency(spareChange.roundedAmount, currency) }}，儲蓄
        {{ formatCurrency(spareChange.spareChange, currency) }}
      </UiCheckbox>
    </form>
  </BaseCard>
</template>
