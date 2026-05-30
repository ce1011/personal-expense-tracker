<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import { formatCurrency, withHash } from '@/lib/formatters'
import type { BudgetCycle, ExpenseCategory, TargetExpenseLimit } from '@/types/app-data'

const props = defineProps<{
  cycle?: BudgetCycle
  categories: readonly ExpenseCategory[]
  limits: readonly TargetExpenseLimit[]
  currency: string
}>()

const emit = defineEmits<{
  saveLimit: [cycleId: string, categoryId: string, amount: number]
}>()

const amounts = reactive<Record<string, number>>({})

const limitByCategory = computed(
  () => new Map(props.limits.map((limit) => [limit.category_id, limit.amount] as const)),
)

watch(
  [() => props.categories, limitByCategory],
  () => {
    for (const category of props.categories) {
      amounts[category.category_id] = limitByCategory.value.get(category.category_id) ?? 0
    }
  },
  { immediate: true },
)

function save(categoryId: string): void {
  if (!props.cycle) {
    return
  }

  emit('saveLimit', props.cycle.cycle_id, categoryId, Number(amounts[categoryId] ?? 0))
}
</script>

<template>
  <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-stone-950">分類預算上限</h2>
        <p class="text-sm text-stone-500">為選中的預算週期設定各支出分類的上限。</p>
      </div>
      <p v-if="cycle" class="text-sm font-medium text-stone-600">{{ cycle.cycle_code }}</p>
    </div>

    <div class="mt-4 grid gap-3">
      <div
        v-for="category in categories"
        :key="category.category_id"
        class="grid gap-3 rounded-md border border-stone-100 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
      >
        <div class="flex items-center gap-3">
          <span class="size-3 rounded-full" :style="{ backgroundColor: withHash(category.color_code) }" />
          <div>
            <p class="text-sm font-semibold text-stone-950">{{ category.name_tc || category.name_en }}</p>
            <p class="text-xs text-stone-500">{{ formatCurrency(amounts[category.category_id] ?? 0, currency) }}</p>
          </div>
        </div>
        <input
          v-model.number="amounts[category.category_id]"
          min="0"
          step="100"
          type="number"
          class="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          class="rounded-md bg-stone-900 px-3 py-2 text-sm font-semibold text-white"
          :disabled="!cycle"
          @click="save(category.category_id)"
        >
          儲存
        </button>
      </div>
    </div>
  </section>
</template>
