<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
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
  SavingChallenge,
  SavingDraft,
  SupportedCurrency,
  TransactionKind,
  TripSession,
} from '@/types/app-data'
import type { SavingCategoryOption } from '@/lib/savingCategories'

const props = defineProps<{
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  savingChallenges?: readonly SavingChallenge[]
  tripOptions?: readonly Pick<TripSession, 'trip_id' | 'name' | 'destination'>[]
  defaultTripId?: string
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
  trip_id: '',
  challenge_id: '',
  recurring: false,
  recurring_frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  recurring_day: 1,
})

const supportedCurrencies: SupportedCurrency[] = ['HKD', 'USD', 'CNY', 'JPY', 'TWD', 'THB']
const isEditing = computed(() => Boolean(props.transaction))
const tripOptions = computed(() => props.tripOptions ?? [])
const savingChallengeOptions = computed(() => props.savingChallenges ?? [])
const availableTripIds = computed(() => new Set(tripOptions.value.map((trip) => trip.trip_id)))
const normalizedDefaultTripId = computed(() =>
  props.defaultTripId && availableTripIds.value.has(props.defaultTripId) ? props.defaultTripId : '',
)
const categories = computed<readonly (ExpenseCategory | IncomeCategory | SavingCategoryOption)[]>(
  () =>
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

const kindOptions: { value: TransactionKind; label: string }[] = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'saving', label: '儲蓄' },
]

const tripSelectOptions = computed(() => [
  { value: '', label: '不關聯旅程' },
  ...tripOptions.value.map((trip) => ({
    value: trip.trip_id,
    label: `${trip.name}｜${trip.destination}`,
  })),
])

const currencyOptions = computed(() =>
  supportedCurrencies.map((currencyCode) => ({
    value: currencyCode,
    label: currencyCode,
  })),
)

const challengeOptions = computed(() => [
  { value: '', label: '不綁定挑戰' },
  ...savingChallengeOptions.value.map((challenge) => ({
    value: challenge.challenge_id,
    label: challenge.name,
  })),
])

const recurringOptions = [
  { value: 'weekly', label: '每週' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
]

function normalizeTripId(tripId?: string): string {
  return tripId && availableTripIds.value.has(tripId) ? tripId : ''
}

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
    form.trip_id = normalizeTripId(transaction.trip_id)
    form.challenge_id = transaction.kind === 'saving' ? (transaction.challenge_id ?? '') : ''
    form.recurring = transaction.kind === 'expense' ? (transaction.recurring ?? false) : false
    form.recurring_frequency =
      transaction.kind === 'expense' ? (transaction.recurring_frequency ?? 'monthly') : 'monthly'
    form.recurring_day = transaction.kind === 'expense' ? (transaction.recurring_day ?? 1) : 1
  },
  { immediate: true },
)

watch(
  () => normalizedDefaultTripId.value,
  (nextDefaultTripId, previousDefaultTripId) => {
    if (props.transaction) {
      return
    }

    if (
      !form.trip_id ||
      form.trip_id === previousDefaultTripId ||
      !availableTripIds.value.has(form.trip_id)
    ) {
      form.trip_id = nextDefaultTripId
    }
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

function setKind(kind: TransactionKind): void {
  if (isEditing.value) {
    return
  }

  form.kind = kind
}

function submitForm(): void {
  if (!canSubmit.value) {
    return
  }

  const baseDraft = {
    category_id: form.category_id,
    name: form.name,
    amount: Number(form.amount),
    date: fromDateInputValue(form.date),
    currency_code: form.currency_code,
    exchange_rate_hkd: selectedRate.value,
    trip_id: form.trip_id || undefined,
  }

  if (form.kind === 'expense') {
    const draft: ExpenseDraft = {
      ...baseDraft,
      recurring: form.recurring,
      recurring_frequency: form.recurring ? form.recurring_frequency : undefined,
      recurring_day: form.recurring ? form.recurring_day : undefined,
    }

    if (props.transaction) {
      emit('updateExpense', props.transaction.id, draft)
    } else {
      emit('createExpense', draft)
    }
  } else if (form.kind === 'income') {
    const draft: IncomeDraft = baseDraft

    if (props.transaction) {
      emit('updateIncome', props.transaction.id, draft)
    } else {
      emit('createIncome', draft)
    }
  } else {
    const draft: SavingDraft = {
      ...baseDraft,
      challenge_id: form.challenge_id || undefined,
    }

    if (props.transaction) {
      emit('updateSaving', props.transaction.id, draft)
    } else {
      emit('createSaving', draft)
    }
  }

  if (!props.transaction) {
    form.name = ''
    form.amount = 0
    form.challenge_id = ''
  }
}

function resetForm(): void {
  form.kind = 'expense'
  form.category_id = ''
  form.name = ''
  form.amount = 0
  form.currency_code = 'HKD'
  form.date = toDateInputValue(Date.now())
  form.trip_id = normalizedDefaultTripId.value
  form.challenge_id = ''
  form.recurring = false
  form.recurring_frequency = 'monthly'
  form.recurring_day = 1
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
  <form class="transaction-form grid gap-4" @submit.prevent="submitForm">
    <div v-if="!isEditing" class="grid grid-cols-3 gap-2 rounded-xl bg-accent p-1">
      <button
        v-for="option in kindOptions"
        :key="option.value"
        type="button"
        class="rounded-lg px-2 py-2 text-sm font-semibold transition"
        :class="
          form.kind === option.value
            ? 'bg-surface text-text shadow-sm'
            : 'text-text-2 hover:text-text'
        "
        @click="setKind(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-else class="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-text">
      {{ form.kind === 'expense' ? '支出' : form.kind === 'income' ? '收入' : '儲蓄' }}
    </div>

    <BaseInput
      v-model="form.name"
      label="名稱"
      placeholder="例如：午餐、MTR、薪金"
      autocomplete="off"
      :autofocus="true"
    />

    <BaseInput
      v-model.number="form.amount"
      label="金額"
      type="number"
      inputmode="decimal"
      placeholder="0"
      min="0"
      step="0.01"
    />

    <div class="grid gap-1.5">
      <p class="text-sm font-medium text-text-2">分類</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category.category_id"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-medium transition"
          :class="
            form.category_id === category.category_id
              ? 'text-white'
              : 'border border-border bg-surface text-text hover:bg-accent'
          "
          :style="
            form.category_id === category.category_id
              ? { backgroundColor: `#${category.color_code}` }
              : undefined
          "
          @click="form.category_id = category.category_id"
        >
          {{ category.name_tc || category.name_en }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <BaseSelect v-model="form.currency_code" label="幣別" :options="currencyOptions" />
      <BaseInput v-model="form.date" label="日期" type="date" />
    </div>

    <BaseSelect
      v-if="tripOptions.length"
      v-model="form.trip_id"
      label="旅程"
      :options="tripSelectOptions"
    />

    <div
      v-if="form.kind === 'expense'"
      class="rounded-xl border border-border transition-colors"
      :class="form.recurring ? 'bg-accent/50' : 'bg-surface'"
    >
      <label class="flex items-center gap-3 px-4 py-3">
        <input
          v-model="form.recurring"
          type="checkbox"
          class="size-5 rounded border-border text-primary focus:ring-primary"
        />
        <span class="text-sm font-medium text-text">定期支出</span>
      </label>

      <div
        v-if="form.recurring"
        class="grid grid-cols-2 gap-3 border-t border-border px-4 pb-4 pt-3"
      >
        <BaseSelect v-model="form.recurring_frequency" label="週期" :options="recurringOptions" />
        <BaseInput
          v-model.number="form.recurring_day"
          label="到期日"
          type="number"
          inputmode="numeric"
          min="1"
          max="31"
        />
      </div>
    </div>

    <BaseSelect
      v-if="form.kind === 'saving'"
      v-model="form.challenge_id"
      label="儲蓄挑戰"
      :options="challengeOptions"
    />

    <div class="rounded-xl bg-accent px-4 py-3 text-sm text-text-2">
      <p>
        將入帳 {{ formatCurrency(convertedAmount, 'HKD') }} · 匯率
        {{ selectedRate > 0 ? selectedRate : '-' }}
      </p>
      <p class="mt-0.5 text-xs text-text-3">匯率日期：{{ latestFxDate || '尚未取得' }}</p>
    </div>

    <div class="transaction-actions flex flex-wrap items-center gap-3 pt-2">
      <BaseButton class="transaction-actions__primary" type="submit" :disabled="!canSubmit">
        {{ isEditing ? '儲存修改' : '新增交易' }}
      </BaseButton>
      <BaseButton variant="secondary" type="button" @click="cancelEdit"> 取消 </BaseButton>
      <BaseButton
        v-if="isEditing"
        variant="danger"
        type="button"
        aria-label="刪除交易"
        @click="removeTransaction"
      >
        <Trash2 class="size-4" aria-hidden="true" />
        刪除
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
@media (max-width: 639px) {
  .transaction-form {
    padding-bottom: calc(5.75rem + env(safe-area-inset-bottom));
  }

  .transaction-actions {
    position: fixed;
    z-index: 2;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 0.5rem;
    margin: 0;
    border-top: 1px solid color-mix(in srgb, var(--color-primary) 12%, var(--color-border));
    background: color-mix(in srgb, white 92%, transparent);
    padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom));
    box-shadow: 0 -12px 36px rgb(67 40 119 / 10%);
    backdrop-filter: blur(20px) saturate(140%);
  }

  .transaction-actions :deep(.base-button) {
    min-width: 0;
    padding-right: 0.85rem;
    padding-left: 0.85rem;
    white-space: nowrap;
  }

  .transaction-actions__primary {
    width: 100%;
  }
}
</style>
