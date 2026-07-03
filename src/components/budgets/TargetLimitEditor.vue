<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Target } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import EmptyState from '@/components/base/EmptyState.vue'
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
  <BaseCard>
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Target class="size-5 text-primary" aria-hidden="true" />
        <div>
          <h2 class="text-h3 font-semibold text-text">分類預算上限</h2>
          <p class="text-body-sm text-text-2">為選中的預算週期設定各支出分類的上限。</p>
        </div>
      </div>
      <p v-if="cycle" class="text-body-sm font-semibold text-primary">{{ cycle.cycle_code }}</p>
    </div>

    <div v-if="categories.length" class="mt-4 grid gap-3">
      <div
        v-for="category in categories"
        :key="category.category_id"
        class="rounded-xl border border-border bg-surface p-3"
      >
        <div class="flex items-center gap-3">
          <span
            class="size-3 rounded-full"
            :style="{ backgroundColor: withHash(category.color_code) }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-body-sm font-semibold text-text">
              {{ category.name_tc || category.name_en }}
            </p>
            <p class="text-caption text-text-2">
              目前上限：{{ formatCurrency(amounts[category.category_id] ?? 0, currency) }}
            </p>
          </div>
          <BaseButton
            variant="primary"
            :disabled="!cycle"
            aria-label="儲存分類上限"
            @click="save(category.category_id)"
          >
            儲存
          </BaseButton>
        </div>

        <BaseInput
          :model-value="amounts[category.category_id] ?? 0"
          class="mt-3"
          type="number"
          min="0"
          step="100"
          placeholder="0"
          @update:model-value="amounts[category.category_id] = $event as number"
        />
      </div>
    </div>

    <EmptyState
      v-else
      class="mt-4"
      :icon="Target"
      title="沒有支出分類"
      message="先新增支出分類，才能為它們設定預算上限。"
    />
  </BaseCard>
</template>
