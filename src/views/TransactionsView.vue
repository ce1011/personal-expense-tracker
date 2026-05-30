<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import { useAppData } from '@/composables/useAppData'
import type { CombinedTransaction, ExpenseDraft, IncomeDraft } from '@/types/app-data'

const appData = useAppData()
const search = shallowRef('')
const selectedTransaction = shallowRef<CombinedTransaction | undefined>()

const filteredTransactions = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return appData.combinedTransactions.value
  }

  return appData.combinedTransactions.value.filter((transaction) =>
    transaction.name.toLowerCase().includes(query),
  )
})

function addExpense(draft: ExpenseDraft): void {
  void appData.addExpense(draft)
}

function addIncome(draft: IncomeDraft): void {
  void appData.addIncome(draft)
}

function startEditing(transaction: CombinedTransaction): void {
  selectedTransaction.value = transaction
}

function cancelEditing(): void {
  selectedTransaction.value = undefined
}

function updateExpense(transactionId: string, draft: ExpenseDraft): void {
  void appData.updateExpense(transactionId, draft).then(cancelEditing)
}

function updateIncome(transactionId: string, draft: IncomeDraft): void {
  void appData.updateIncome(transactionId, draft).then(cancelEditing)
}

function deleteTransaction(transaction: CombinedTransaction): void {
  const confirmed = globalThis.confirm?.(`確定要刪除「${transaction.name}」嗎？`) ?? true

  if (!confirmed) {
    return
  }

  const action =
    transaction.kind === 'expense'
      ? appData.deleteExpense(transaction.id)
      : appData.deleteIncome(transaction.id)

  void action.then(() => {
    if (selectedTransaction.value?.id === transaction.id) {
      cancelEditing()
    }
  })
}

function deleteSelectedTransaction(): void {
  if (!selectedTransaction.value) {
    return
  }

  deleteTransaction(selectedTransaction.value)
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">流水帳</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">交易紀錄</h1>
    </section>

    <TransactionForm
      v-if="selectedTransaction"
      :key="`edit-${selectedTransaction.id}`"
      :expense-categories="appData.activeExpenseCategories.value"
      :income-categories="appData.activeIncomeCategories.value"
      :fx-rate-map="appData.fxRateMap.value"
      :latest-fx-date="appData.latestFxDate.value"
      :transaction="selectedTransaction"
      @update-expense="updateExpense"
      @update-income="updateIncome"
      @delete-transaction="deleteSelectedTransaction"
      @cancel-edit="cancelEditing"
    />
    <TransactionForm
      v-else
      key="create"
      :expense-categories="appData.activeExpenseCategories.value"
      :income-categories="appData.activeIncomeCategories.value"
      :fx-rate-map="appData.fxRateMap.value"
      :latest-fx-date="appData.latestFxDate.value"
      @create-expense="addExpense"
      @create-income="addIncome"
    />

    <section class="grid gap-3">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        搜尋交易
        <input v-model="search" class="rounded-md border border-stone-300 bg-white px-3 py-2" placeholder="按名稱搜尋" />
      </label>
      <TransactionList
        v-if="filteredTransactions.length"
        :items="filteredTransactions"
        :expense-categories="appData.data.value.expenseCategories"
        :income-categories="appData.data.value.incomeCategories"
        :currency="appData.currency.value"
        show-actions
        @edit="startEditing"
        @delete="deleteTransaction"
      />
      <EmptyState v-else title="找不到交易" message="試試其他關鍵字，或先新增一筆交易。" />
    </section>
  </div>
</template>
