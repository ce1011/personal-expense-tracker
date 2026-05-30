<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import { useAppData } from '@/composables/useAppData'
import type { ExpenseDraft, IncomeDraft } from '@/types/app-data'

const appData = useAppData()
const search = shallowRef('')

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
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">流水帳</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">交易紀錄</h1>
    </section>

    <TransactionForm
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
      />
      <EmptyState v-else title="找不到交易" message="試試其他關鍵字，或先新增一筆交易。" />
    </section>
  </div>
</template>
