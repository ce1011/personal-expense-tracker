<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import { getFrequencyLabel, getRecurringDayLabel } from '@/lib/dailyFinance/recurringExpenses'
import { formatCurrency } from '@/lib/formatters'
import type { ExpenseCategory, ExpenseTransaction } from '@/types/app-data'

const props = defineProps<{
  fixedExpenses: readonly ExpenseTransaction[]
  expenseCategories: readonly ExpenseCategory[]
  currency: string
}>()

const emit = defineEmits<{
  edit: [transaction: ExpenseTransaction]
  delete: [transactionId: string]
}>()

const categoryMap = computed(() => {
  const map = new Map<string, ExpenseCategory>()
  for (const category of props.expenseCategories) {
    map.set(category.category_id, category)
  }
  return map
})

function getCategory(transaction: ExpenseTransaction): ExpenseCategory | undefined {
  return categoryMap.value.get(transaction.category_id)
}

function confirmDelete(transaction: ExpenseTransaction): void {
  if (confirm(`確定要刪除「${transaction.name}」這個固定開支嗎？`)) {
    emit('delete', transaction.transaction_id)
  }
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">固定開支列表</h2>
        <p class="mt-1 text-sm text-stone-500">管理會定期發生的支出</p>
      </div>
    </div>

    <div v-if="fixedExpenses.length" class="divide-y divide-stone-100">
      <div
        v-for="expense in fixedExpenses"
        :key="expense.transaction_id"
        class="flex items-center justify-between gap-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-sm font-medium text-stone-900">
            <span
              class="inline-block size-3 shrink-0 rounded-full"
              :style="{ backgroundColor: `#${getCategory(expense)?.color_code ?? '78716c'}` }"
              aria-hidden="true"
            />
            <span class="truncate">{{ expense.name }}</span>
          </div>
          <p class="mt-1 text-xs text-stone-500">
            {{ getFrequencyLabel(expense.recurring_frequency ?? 'monthly') }} ·
            {{
              getRecurringDayLabel(
                expense.recurring_frequency ?? 'monthly',
                expense.recurring_day ?? 1,
              )
            }}
            <template v-if="getCategory(expense)">
              · {{ getCategory(expense)?.name_tc || getCategory(expense)?.name_en }}
            </template>
          </p>
        </div>

        <div class="flex items-center gap-4">
          <p class="text-right text-sm font-semibold text-stone-950">
            {{ formatCurrency(expense.amount, currency) }}
          </p>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="修改固定開支"
              title="修改"
              @click="emit('edit', expense)"
            >
              <Pencil class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
              aria-label="刪除固定開支"
              title="刪除"
              @click="confirmDelete(expense)"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="目前沒有固定開支"
      message="新增固定開支後，它們會顯示在這裡並自動計入本期預算。"
    />
  </article>
</template>
