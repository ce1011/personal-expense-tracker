<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Plus, Receipt } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
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
  <div class="grid gap-4">
    <header class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">資料維護</p>
        <h1 class="mt-1 text-h1 font-bold text-text">固定開支</h1>
        <p class="mt-1 text-body-sm text-text-2">管理會定期發生的支出，並查看本期預估總額。</p>
      </div>
      <BaseButton @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        新增固定開支
      </BaseButton>
    </header>

    <p v-if="appData.error.value" class="rounded-xl bg-danger/5 px-3 py-2 text-body-sm text-danger">
      {{ appData.error.value }}
    </p>

    <section v-if="appData.loading.value" class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </section>

    <section v-else class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <BaseCard>
        <div class="flex items-center gap-2">
          <Receipt class="size-5 text-primary" aria-hidden="true" />
          <div>
            <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
              本期固定支出
            </p>
            <p class="mt-1 text-amount font-bold text-text">
              {{ formatCurrency(appData.cycleFixedExpensesTotal.value, appData.currency.value) }}
            </p>
          </div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="flex items-center gap-2">
          <Receipt class="size-5 text-warning" aria-hidden="true" />
          <div>
            <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
              即將到期帳單
            </p>
            <p class="mt-1 text-amount font-bold text-text">
              {{ appData.upcomingBills.value.length }} 筆
            </p>
          </div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="flex items-center gap-2">
          <Receipt class="size-5 text-text-2" aria-hidden="true" />
          <div>
            <p class="text-caption font-semibold uppercase tracking-[0.12em] text-text-3">
              平均每筆固定開支
            </p>
            <p class="mt-1 text-amount font-bold text-text">
              {{ formatCurrency(averageAmount, appData.currency.value) }}
            </p>
          </div>
        </div>
      </BaseCard>
    </section>

    <SkeletonList v-if="appData.loading.value" :rows="4" />

    <FixedExpensesList
      v-else
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
