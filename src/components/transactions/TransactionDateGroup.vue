<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import TransactionListItem from '@/components/transactions/TransactionListItem.vue'
import type { CombinedTransaction, ExpenseCategory, IncomeCategory } from '@/types/app-data'

defineProps<{
  label: string
  items: readonly CombinedTransaction[]
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  currency: string
}>()

const emit = defineEmits<{
  select: [item: CombinedTransaction]
}>()

function handleSelect(item: CombinedTransaction): void {
  emit('select', item)
}
</script>

<template>
  <BaseCard class="overflow-hidden p-0">
    <p class="bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-2">
      {{ label }}
    </p>
    <div class="divide-y divide-border">
      <TransactionListItem
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :item="item"
        :expense-categories="expenseCategories"
        :income-categories="incomeCategories"
        :currency="currency"
        @select="handleSelect"
      />
    </div>
  </BaseCard>
</template>
