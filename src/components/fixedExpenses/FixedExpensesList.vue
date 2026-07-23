<script setup lang="ts">
import { Check, Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
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
  record: [transaction: ExpenseTransaction]
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
  <BaseCard>
    <div class="mb-4">
      <h2 class="text-h3 font-semibold text-text">固定開支列表</h2>
      <p class="text-body-sm text-text-2">管理會定期發生的支出</p>
    </div>

    <div v-if="fixedExpenses.length" class="grid gap-2">
      <div
        v-for="expense in fixedExpenses"
        :key="expense.transaction_id"
        class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 text-left"
          @click="emit('edit', expense)"
        >
          <span
            class="inline-block size-3 shrink-0 rounded-full"
            :style="{ backgroundColor: `#${getCategory(expense)?.color_code ?? '78716c'}` }"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="truncate text-body-sm font-semibold text-text">{{ expense.name }}</p>
            <p class="text-caption text-text-2">
              {{ getFrequencyLabel(expense.recurring_frequency ?? 'monthly') }} ·
              {{
                getRecurringDayLabel(
                  expense.recurring_frequency ?? 'monthly',
                  expense.recurring_day ?? 1,
                )
              }}
              <template v-if="getCategory(expense)"
                >· {{ getCategory(expense)?.name_tc || getCategory(expense)?.name_en }}</template
              >
            </p>
          </div>
        </button>

        <div class="flex items-center gap-1">
          <p class="mr-2 text-right text-body-sm font-semibold text-text">
            {{ formatCurrency(expense.amount, currency) }}
          </p>
          <button
            type="button"
            class="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-primary transition hover:bg-accent"
            :aria-label="`記錄${expense.name}為實際支出`"
            @click="emit('record', expense)"
          >
            <Check class="size-4" aria-hidden="true" />
            記錄
          </button>
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-xl text-text-2 transition hover:bg-accent hover:text-text"
            aria-label="修改固定開支"
            @click="emit('edit', expense)"
          >
            <Pencil class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-xl text-text-2 transition hover:bg-danger/5 hover:text-danger"
            aria-label="刪除固定開支"
            @click="confirmDelete(expense)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      class="mt-4"
      :icon="Pencil"
      title="目前沒有固定開支"
      message="新增固定開支後，它們會顯示在這裡並自動計入本期預算。"
    />
  </BaseCard>
</template>
