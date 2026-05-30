<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { CirclePlus } from 'lucide-vue-next'

import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import type { ExpenseCategory, ExpenseDraft, IncomeCategory, IncomeDraft, TransactionKind } from '@/types/app-data'

const props = defineProps<{
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  compact?: boolean
}>()

const emit = defineEmits<{
  createExpense: [draft: ExpenseDraft]
  createIncome: [draft: IncomeDraft]
}>()

const form = reactive({
  kind: 'expense' as TransactionKind,
  category_id: '',
  name: '',
  amount: 0,
  date: toDateInputValue(Date.now()),
})

const categories = computed(() =>
  form.kind === 'expense' ? props.expenseCategories : props.incomeCategories,
)
const canSubmit = computed(
  () => form.category_id !== '' && form.name.trim() !== '' && Number(form.amount) > 0,
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
  }

  if (form.kind === 'expense') {
    emit('createExpense', draft)
  } else {
    emit('createIncome', draft)
  }

  form.name = ''
  form.amount = 0
}
</script>

<template>
  <form class="rounded-md border border-stone-200 bg-white p-4 shadow-sm" @submit.prevent="submitForm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-stone-950">{{ compact ? 'Quick add' : 'Add transaction' }}</p>
        <p class="text-xs text-stone-500">Expenses and incomes use separate category lists.</p>
      </div>
      <CirclePlus class="size-5 text-emerald-800" aria-hidden="true" />
    </div>

    <div class="mt-4 grid gap-3" :class="compact ? 'md:grid-cols-2' : 'md:grid-cols-5'">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        Type
        <select v-model="form.kind" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        Category
        <select v-model="form.category_id" class="rounded-md border border-stone-300 bg-white px-3 py-2">
          <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
            {{ category.name_en }}
          </option>
        </select>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        Name
        <input v-model.trim="form.name" class="rounded-md border border-stone-300 px-3 py-2" placeholder="Lunch, MTR, salary" />
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        Amount
        <input v-model.number="form.amount" min="0" step="0.01" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        Date
        <input v-model="form.date" type="date" class="rounded-md border border-stone-300 px-3 py-2" />
      </label>
    </div>

    <button
      type="submit"
      class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-300"
      :disabled="!canSubmit"
    >
      Add transaction
    </button>
  </form>
</template>
