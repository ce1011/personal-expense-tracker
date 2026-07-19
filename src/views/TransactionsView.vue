<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'

import BaseInput from '@/components/base/BaseInput.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import QuickAddSheet from '@/components/transactions/QuickAddSheet.vue'
import TransactionDateGroup from '@/components/transactions/TransactionDateGroup.vue'
import { useAppData } from '@/composables/useAppData'
import { useTransactionsQuery } from '@/composables/useTransactionsQuery'
import type { CombinedTransaction, ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const query = useTransactionsQuery()
const { filters } = query

const selectedTransaction = shallowRef<CombinedTransaction | undefined>()
const showFilters = shallowRef(false)

const kindOptions: { value: typeof filters.kind; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'saving', label: '儲蓄' },
]

const datePresetOptions: { value: typeof filters.datePreset; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'cycle', label: '本期' },
  { value: 'previous', label: '上期' },
  { value: 'future', label: '未來' },
  { value: 'custom', label: '自訂' },
]

const availableCategories = computed(() => {
  if (filters.kind === 'expense') {
    return query.activeExpenseCategories.value
  }

  if (filters.kind === 'income') {
    return query.activeIncomeCategories.value
  }

  if (filters.kind === 'saving') {
    return query.savingCategoryOptions.value
  }

  return [
    ...query.activeExpenseCategories.value.map((category) => ({
      ...category,
      kind: 'expense' as const,
    })),
    ...query.activeIncomeCategories.value.map((category) => ({
      ...category,
      kind: 'income' as const,
    })),
    ...query.savingCategoryOptions.value.map((category) => ({
      ...category,
      kind: 'saving' as const,
    })),
  ]
})

const categoryNameById = computed(() => {
  const map = new Map<string, string>()
  for (const category of availableCategories.value) {
    map.set(category.category_id, category.name_tc || category.name_en)
  }
  return map
})

const tripNameById = computed(() => {
  const map = new Map<string, string>()
  map.set('unassigned', '未關聯旅程')
  for (const trip of query.trips.value) {
    map.set(trip.trip_id, `${trip.name}｜${trip.destination}`)
  }
  return map
})

const activeFilterChips = computed(() => {
  const chips: { key: string; label: string }[] = []

  if (filters.tripId !== 'all') {
    chips.push({ key: 'trip', label: tripNameById.value.get(filters.tripId) ?? '旅程' })
  }

  if (filters.categoryId !== 'all') {
    chips.push({
      key: 'category',
      label: categoryNameById.value.get(filters.categoryId) ?? '分類',
    })
  }

  return chips
})

function addExpense(draft: ExpenseDraft): void {
  void appData.addExpense(draft)
  selectedTransaction.value = undefined
}

function addIncome(draft: IncomeDraft): void {
  void appData.addIncome(draft)
  selectedTransaction.value = undefined
}

function addSaving(draft: SavingDraft): void {
  void appData.addSaving(draft)
  selectedTransaction.value = undefined
}

function startEditing(transaction: CombinedTransaction): void {
  selectedTransaction.value = transaction
}

function closeSheet(): void {
  selectedTransaction.value = undefined
}

function updateExpense(transactionId: string, draft: ExpenseDraft): void {
  void appData.updateExpense(transactionId, draft).then(closeSheet)
}

function updateIncome(transactionId: string, draft: IncomeDraft): void {
  void appData.updateIncome(transactionId, draft).then(closeSheet)
}

function updateSaving(transactionId: string, draft: SavingDraft): void {
  void appData.updateSaving(transactionId, draft).then(closeSheet)
}

function deleteTransaction(): void {
  const transaction = selectedTransaction.value
  if (!transaction) {
    return
  }

  const confirmed = globalThis.confirm?.(`確定要刪除「${transaction.name}」嗎？`) ?? true

  if (!confirmed) {
    return
  }

  const action =
    transaction.kind === 'expense'
      ? appData.deleteExpense(transaction.id)
      : transaction.kind === 'income'
        ? appData.deleteIncome(transaction.id)
        : appData.deleteSaving(transaction.id)

  void action.then(closeSheet)
}

function removeFilterChip(key: string): void {
  if (key === 'trip') {
    filters.tripId = 'all'
  } else if (key === 'category') {
    filters.categoryId = 'all'
  }
}

function setKind(value: typeof filters.kind): void {
  filters.kind = value
}

function setDatePreset(value: typeof filters.datePreset): void {
  query.setDatePreset(value)
}

function setTripFilter(tripId: string): void {
  filters.tripId = tripId
}

function setCategoryFilter(categoryId: string): void {
  filters.categoryId = categoryId
}
</script>

<template>
  <div class="grid gap-4">
    <section
      class="sticky top-14 z-10 -mx-4 border-b border-border bg-bg px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <BaseInput
            v-model="filters.search"
            placeholder="搜尋交易名稱"
            type="search"
            inputmode="search"
          />
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-text transition hover:bg-accent"
          :class="showFilters ? 'bg-accent' : ''"
          aria-label="篩選"
          @click="showFilters = !showFilters"
        >
          篩選
        </button>
      </div>

      <div v-if="showFilters" class="mt-3 space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in kindOptions"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="
              filters.kind === option.value
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-text hover:bg-accent'
            "
            @click="setKind(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in datePresetOptions"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition"
            :class="
              filters.datePreset === option.value
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-text hover:bg-accent'
            "
            @click="setDatePreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-if="filters.datePreset === 'custom'" class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1.5 text-xs font-medium text-text-2">
            開始日期
            <BaseInput v-model="filters.fromDate" type="date" />
          </label>
          <label class="grid gap-1.5 text-xs font-medium text-text-2">
            結束日期
            <BaseInput v-model="filters.toDate" type="date" />
          </label>
        </div>

        <div v-if="query.trips.value.length" class="grid gap-1.5">
          <p class="text-xs font-medium text-text-2">旅程</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                filters.tripId === 'all'
                  ? 'bg-primary text-white'
                  : 'border border-border bg-surface text-text hover:bg-accent'
              "
              @click="setTripFilter('all')"
            >
              全部
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                filters.tripId === 'unassigned'
                  ? 'bg-primary text-white'
                  : 'border border-border bg-surface text-text hover:bg-accent'
              "
              @click="setTripFilter('unassigned')"
            >
              未關聯
            </button>
            <button
              v-for="trip in query.trips.value"
              :key="trip.trip_id"
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                filters.tripId === trip.trip_id
                  ? 'bg-primary text-white'
                  : 'border border-border bg-surface text-text hover:bg-accent'
              "
              @click="setTripFilter(trip.trip_id)"
            >
              {{ trip.name }}
            </button>
          </div>
        </div>

        <div class="grid gap-1.5">
          <p class="text-xs font-medium text-text-2">分類</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                filters.categoryId === 'all'
                  ? 'bg-primary text-white'
                  : 'border border-border bg-surface text-text hover:bg-accent'
              "
              @click="setCategoryFilter('all')"
            >
              全部
            </button>
            <button
              v-for="category in availableCategories"
              :key="
                'kind' in category
                  ? `${category.kind}-${category.category_id}`
                  : category.category_id
              "
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                filters.categoryId === category.category_id
                  ? 'text-white'
                  : 'border border-border bg-surface text-text hover:bg-accent'
              "
              :style="
                filters.categoryId === category.category_id
                  ? { backgroundColor: `#${category.color_code}` }
                  : undefined
              "
              @click="setCategoryFilter(category.category_id)"
            >
              {{ category.name_tc || category.name_en }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeFilterChips.length" class="mt-3 flex flex-wrap items-center gap-2">
        <span
          v-for="chip in activeFilterChips"
          :key="chip.key"
          class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
        >
          {{ chip.label }}
          <button
            type="button"
            class="inline-flex size-4 items-center justify-center rounded-full text-primary hover:bg-primary/20"
            :aria-label="`移除 ${chip.label} 篩選`"
            @click="removeFilterChip(chip.key)"
          >
            ×
          </button>
        </span>
        <button
          type="button"
          class="text-xs font-medium text-text-2 hover:text-text"
          @click="query.resetFilters"
        >
          清除全部
        </button>
      </div>
    </section>

    <section class="grid gap-4">
      <SkeletonList v-if="query.loading.value" :rows="6" />
      <div v-else-if="query.groups.value.length" class="space-y-4">
        <TransactionDateGroup
          v-for="group in query.groups.value"
          :key="group.label"
          :label="group.label"
          :items="group.items"
          :expense-categories="query.expenseCategories.value"
          :income-categories="query.incomeCategories.value"
          :currency="query.currency.value"
          @select="startEditing"
        />
      </div>
      <EmptyState
        v-else
        :icon="SearchX"
        title="找不到交易"
        message="試試其他關鍵字，或先新增一筆交易。"
      />
    </section>

    <QuickAddSheet
      :model-value="Boolean(selectedTransaction)"
      :transaction="selectedTransaction"
      :expense-categories="query.activeExpenseCategories.value"
      :income-categories="query.activeIncomeCategories.value"
      :saving-challenges="query.savingChallenges.value"
      :trip-options="query.trips.value"
      :default-trip-id="appData.activeTripId.value || undefined"
      :fx-rate-map="query.fxRateMap.value"
      :latest-fx-date="query.latestFxDate.value"
      @update:model-value="closeSheet"
      @create-expense="addExpense"
      @create-income="addIncome"
      @create-saving="addSaving"
      @update-expense="updateExpense"
      @update-income="updateIncome"
      @update-saving="updateSaving"
      @delete-transaction="deleteTransaction"
    />
  </div>
</template>
