<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-vue-next'

import { formatCurrency, formatDate, withHash } from '@/lib/formatters'
import { savingCategories } from '@/lib/savingCategories'
import type { CombinedTransaction, ExpenseCategory, IncomeCategory } from '@/types/app-data'

const props = defineProps<{
  item: CombinedTransaction
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  currency: string
}>()

const emit = defineEmits<{
  select: [item: CombinedTransaction]
}>()

const categoryById = computed(() => {
  const entries = [...props.expenseCategories, ...props.incomeCategories, ...savingCategories].map(
    (category) => [category.category_id, category] as const,
  )
  return new Map(entries)
})

const category = computed(() => categoryById.value.get(props.item.category_id))
const isIncome = computed(() => props.item.kind === 'income')
const sign = computed(() => (isIncome.value ? '+' : '-'))
const showOriginal = computed(
  () =>
    props.item.original_currency &&
    props.item.original_amount &&
    props.item.original_currency !== props.currency,
)

function handleClick(): void {
  emit('select', props.item)
}
</script>

<template>
  <button
    type="button"
    class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/50"
    @click="handleClick"
  >
    <div
      class="grid size-11 place-items-center rounded-full"
      :style="{ backgroundColor: withHash(category?.color_code ?? 'd6d0c4') }"
    >
      <ArrowUpRight v-if="item.kind === 'expense'" class="size-5 text-white" aria-hidden="true" />
      <ArrowDownLeft
        v-else-if="item.kind === 'income'"
        class="size-5 text-white"
        aria-hidden="true"
      />
      <PiggyBank v-else class="size-5 text-white" aria-hidden="true" />
    </div>

    <div class="min-w-0">
      <p class="truncate text-base font-semibold text-text">{{ item.name }}</p>
      <p class="text-sm text-text-2">
        {{ category?.name_tc || category?.name_en || '未分類' }} · {{ formatDate(item.date) }}
      </p>
      <p v-if="showOriginal" class="text-xs text-text-3">
        原幣：{{ item.original_currency }} {{ item.original_amount }}
      </p>
    </div>

    <div class="text-right">
      <p class="text-base font-bold" :class="isIncome ? 'text-primary' : 'text-text'">
        {{ sign }}{{ formatCurrency(item.amount, currency) }}
      </p>
    </div>
  </button>
</template>
