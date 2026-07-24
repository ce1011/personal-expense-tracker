<script setup lang="ts">
import { computed } from 'vue'

import UiBottomSheet from '@/components/ui/UiBottomSheet.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import type {
  CombinedTransaction,
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SavingChallenge,
  SavingDraft,
  SupportedCurrency,
  TripSession,
} from '@/types/app-data'

const props = defineProps<{
  modelValue: boolean
  transaction?: CombinedTransaction
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  savingChallenges?: readonly SavingChallenge[]
  tripOptions?: readonly Pick<TripSession, 'trip_id' | 'name' | 'destination'>[]
  defaultTripId?: string
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  createExpense: [draft: ExpenseDraft]
  createIncome: [draft: IncomeDraft]
  createSaving: [draft: SavingDraft]
  updateExpense: [transactionId: string, draft: ExpenseDraft]
  updateIncome: [transactionId: string, draft: IncomeDraft]
  updateSaving: [transactionId: string, draft: SavingDraft]
  deleteTransaction: []
}>()

const isEditing = computed(() => Boolean(props.transaction))
const title = computed(() => (isEditing.value ? '交易詳情' : '記一筆'))
const subtitle = computed(() =>
  isEditing.value ? '在此編輯或刪除這筆交易。' : '新增後會立即寫入帳目，並自動換算成港幣。',
)

function close(): void {
  emit('update:modelValue', false)
}

function handleCreateExpense(draft: ExpenseDraft): void {
  emit('createExpense', draft)
  close()
}

function handleCreateIncome(draft: IncomeDraft): void {
  emit('createIncome', draft)
  close()
}

function handleCreateSaving(draft: SavingDraft): void {
  emit('createSaving', draft)
  close()
}

function handleUpdateExpense(transactionId: string, draft: ExpenseDraft): void {
  emit('updateExpense', transactionId, draft)
  close()
}

function handleUpdateIncome(transactionId: string, draft: IncomeDraft): void {
  emit('updateIncome', transactionId, draft)
  close()
}

function handleUpdateSaving(transactionId: string, draft: SavingDraft): void {
  emit('updateSaving', transactionId, draft)
  close()
}

function handleDeleteTransaction(): void {
  emit('deleteTransaction')
  close()
}

function handleCancelEdit(): void {
  close()
}
</script>

<template>
  <UiBottomSheet :show="modelValue" :title="title" :subtitle="subtitle" @close="close">
    <TransactionForm
      :expense-categories="expenseCategories"
      :income-categories="incomeCategories"
      :saving-challenges="savingChallenges"
      :trip-options="tripOptions"
      :default-trip-id="defaultTripId"
      :fx-rate-map="fxRateMap"
      :latest-fx-date="latestFxDate"
      :transaction="transaction"
      @create-expense="handleCreateExpense"
      @create-income="handleCreateIncome"
      @create-saving="handleCreateSaving"
      @update-expense="handleUpdateExpense"
      @update-income="handleUpdateIncome"
      @update-saving="handleUpdateSaving"
      @delete-transaction="handleDeleteTransaction"
      @cancel-edit="handleCancelEdit"
    />
  </UiBottomSheet>
</template>
