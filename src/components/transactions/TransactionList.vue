<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownLeft, ArrowUpRight, PencilLine, Trash2 } from 'lucide-vue-next'

import { formatCurrency, formatDate, withHash } from '@/lib/formatters'
import { savingCategories } from '@/lib/savingCategories'
import type { CombinedTransaction, ExpenseCategory, IncomeCategory } from '@/types/app-data'

const props = defineProps<{
  items: readonly CombinedTransaction[]
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  currency: string
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: [item: CombinedTransaction]
  delete: [item: CombinedTransaction]
}>()

const categoryById = computed(() => {
  const entries = [...props.expenseCategories, ...props.incomeCategories, ...savingCategories].map((category) => [
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
        <ArrowDownLeft v-else-if="item.kind === 'income'" class="size-4 text-white" aria-hidden="true" />
        <ArrowUpRight v-else class="size-4 text-white" aria-hidden="true" />
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
        :class="item.kind === 'income' ? 'text-emerald-800' : 'text-stone-950'"
      >
        {{ item.kind === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount, currency) }}
      </p>
      <div v-if="showActions" class="col-span-full flex justify-end gap-2 pt-1">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
          @click="emit('edit', item)"
        >
          <PencilLine class="size-3.5" aria-hidden="true" />
          修改
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
          @click="emit('delete', item)"
        >
          <Trash2 class="size-3.5" aria-hidden="true" />
          刪除
        </button>
      </div>
    </div>
  </div>
</template>
