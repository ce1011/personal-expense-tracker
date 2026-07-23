<script setup lang="ts">
import { shallowRef } from 'vue'
import { Plus, Receipt } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import FixedExpenseForm from '@/components/fixedExpenses/FixedExpenseForm.vue'
import FixedExpensesList from '@/components/fixedExpenses/FixedExpensesList.vue'
import { useAppData } from '@/composables/useAppData'
import { useFixedExpensesData } from '@/composables/useFixedExpensesData'
import { formatCurrency } from '@/lib/formatters'
import type { ExpenseDraft, ExpenseTransaction, SupportedCurrency } from '@/types/app-data'

const appData = useAppData()
const {
  fixedExpenses,
  cycleFixedExpensesTotal,
  upcomingBills,
  activeExpenseCategories,
  currency,
  averageAmount,
  loading,
  error,
} = useFixedExpensesData()

const isFormOpen = shallowRef(false)
const editingTransaction = shallowRef<ExpenseTransaction | undefined>(undefined)

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

async function recordExpense(transaction: ExpenseTransaction): Promise<void> {
  await appData.addExpense({
    category_id: transaction.category_id,
    name: transaction.name,
    amount: transaction.amount,
    date: Date.now(),
    currency_code: currency.value as SupportedCurrency,
    exchange_rate_hkd: 1,
    recurring: false,
    recurring_frequency: undefined,
    recurring_day: undefined,
  })
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

    <p v-if="error" class="rounded-xl bg-danger/5 px-3 py-2 text-body-sm text-danger">
      {{ error }}
    </p>

    <section v-if="loading" class="grid grid-cols-2 gap-3 md:grid-cols-3">
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
              {{ formatCurrency(cycleFixedExpensesTotal, currency) }}
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
            <p class="mt-1 text-amount font-bold text-text">{{ upcomingBills.length }} 筆</p>
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
              {{ formatCurrency(averageAmount, currency) }}
            </p>
          </div>
        </div>
      </BaseCard>
    </section>

    <SkeletonList v-if="loading" :rows="4" />

    <FixedExpensesList
      v-else
      :fixed-expenses="fixedExpenses"
      :expense-categories="activeExpenseCategories"
      :currency="currency"
      @edit="openEdit"
      @record="recordExpense"
      @delete="deleteExpense"
    />

    <FixedExpenseForm
      :show="isFormOpen"
      :expense-categories="activeExpenseCategories"
      :currency="currency"
      :transaction="editingTransaction"
      @close="closeForm"
      @create="createExpense"
      @update="updateExpense"
    />
  </div>
</template>
