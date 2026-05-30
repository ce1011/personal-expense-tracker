<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-vue-next'

import { formatCurrency, formatDate, withHash } from '@/lib/formatters'
import type { CombinedTransaction, ExpenseCategory, IncomeCategory } from '@/types/app-data'

const props = defineProps<{
  items: readonly CombinedTransaction[]
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  currency: string
}>()

const categoryById = computed(() => {
  const entries = [...props.expenseCategories, ...props.incomeCategories].map((category) => [
    category.category_id,
    category,
  ] as const)
  return new Map(entries)
})
</script>

<template>
  <div class="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
    <div
      v-for="item in items"
      :key="`${item.kind}-${item.id}`"
      class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-stone-100 px-4 py-3 last:border-b-0"
    >
      <div
        class="grid size-9 place-items-center rounded-md"
        :style="{ backgroundColor: withHash(categoryById.get(item.category_id)?.color_code ?? 'd6d0c4') }"
      >
        <ArrowUpRight v-if="item.kind === 'expense'" class="size-4 text-white" aria-hidden="true" />
        <ArrowDownLeft v-else class="size-4 text-white" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-stone-950">{{ item.name }}</p>
        <p class="text-xs text-stone-500">
          {{ categoryById.get(item.category_id)?.name_tc || categoryById.get(item.category_id)?.name_en || '未分類' }} · {{ formatDate(item.date) }}
        </p>
        <p v-if="item.original_currency && item.original_amount" class="text-xs text-stone-400">
          原幣：{{ item.original_currency }} {{ item.original_amount }}
        </p>
      </div>
      <p
        class="text-right text-sm font-semibold"
        :class="item.kind === 'expense' ? 'text-stone-950' : 'text-emerald-800'"
      >
        {{ item.kind === 'expense' ? '-' : '+' }}{{ formatCurrency(item.amount, currency) }}
      </p>
    </div>
  </div>
</template>
