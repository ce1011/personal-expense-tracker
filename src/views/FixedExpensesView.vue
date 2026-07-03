<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Plus } from 'lucide-vue-next'

import MetricCard from '@/components/common/MetricCard.vue'
import FixedExpenseForm from '@/components/fixedExpenses/FixedExpenseForm.vue'
import FixedExpensesList from '@/components/fixedExpenses/FixedExpensesList.vue'
import { useAppData } from '@/composables/useAppData'
import { formatCurrency } from '@/lib/formatters'
import type { ExpenseDraft, ExpenseTransaction } from '@/types/app-data'

const appData = useAppData()
const isFormOpen = shallowRef(false)
const editingTransaction = shallowRef<ExpenseTransaction | undefined>(undefined)

const fixedExpenses = computed(() =>
  appData.data.value.expenses.filter((expense) => expense.recurring === true),
)

const averageAmount = computed(() => {
  if (fixedExpenses.value.length === 0) {
    return 0
  }

  return (
    fixedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0) /
    fixedExpenses.value.length
  )
})

function openCreate(): void {
  editingTransaction.value = undefined
  isFormOpen.value = true
}

function openEdit(transaction: ExpenseTransaction): void {
  editingTransaction.value = transaction
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingTransaction.value = undefined
}

async function createExpense(draft: ExpenseDraft): Promise<void> {
  await appData.addExpense(draft)
  closeForm()
}

async function updateExpense(transactionId: string, draft: ExpenseDraft): Promise<void> {
  await appData.updateExpense(transactionId, draft)
  closeForm()
}

async function deleteExpense(transactionId: string): Promise<void> {
  await appData.deleteExpense(transactionId)
}
</script>

<template>
  <div class="grid gap-6">
    <section class="grid gap-4">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">資料維護</p>
          <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">固定開支</h1>
          <p class="mt-2 text-sm text-stone-600">管理會定期發生的支出，並查看本期預估總額。</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
          @click="openCreate"
        >
          <Plus class="size-4" aria-hidden="true" />
          新增固定開支
        </button>
      </div>

      <p v-if="appData.error.value" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ appData.error.value }}
      </p>
    </section>

    <section class="grid gap-3 md:grid-cols-3">
      <MetricCard
        label="本期固定支出總額"
        :value="formatCurrency(appData.cycleFixedExpensesTotal.value, appData.currency.value)"
        detail="本期週期內預估固定支出"
      />
      <MetricCard
        label="即將到期帳單"
        :value="`${appData.upcomingBills.value.length} 筆`"
        detail="未來 14 天內到期的固定開支"
      />
      <MetricCard
        label="平均每筆固定開支"
        :value="formatCurrency(averageAmount, appData.currency.value)"
        :detail="`共 ${fixedExpenses.length} 筆固定開支`"
      />
    </section>

    <FixedExpensesList
      :fixed-expenses="fixedExpenses"
      :expense-categories="appData.activeExpenseCategories.value"
      :currency="appData.currency.value"
      @edit="openEdit"
      @delete="deleteExpense"
    />

    <FixedExpenseForm
      :show="isFormOpen"
      :expense-categories="appData.activeExpenseCategories.value"
      :currency="appData.currency.value"
      :transaction="editingTransaction"
      @close="closeForm"
      @create="createExpense"
      @update="updateExpense"
    />
  </div>
</template>
