<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import { computed, reactive, shallowRef, watch } from 'vue'

import BaseInput from '@/components/base/BaseInput.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import QuickAddSheet from '@/components/transactions/QuickAddSheet.vue'
import TransactionDateGroup from '@/components/transactions/TransactionDateGroup.vue'
import { useAppData } from '@/composables/useAppData'
import { startOfLocalDay } from '@/lib/date'
import { savingCategories } from '@/lib/savingCategories'
import type { CombinedTransaction, ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const search = shallowRef('')
const selectedTransaction = shallowRef<CombinedTransaction | undefined>()
const showFilters = shallowRef(false)

const filters = reactive({
  tripId: 'all',
  kind: 'all' as 'all' | 'expense' | 'income' | 'saving',
  categoryId: 'all',
  datePreset: 'all' as 'all' | 'today' | 'cycle' | 'future',
})

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
  { value: 'future', label: '未來' },
]

const todayWindow = computed(() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return { start, end: start + 86_400_000 }
})

const availableCategories = computed(() => {
  if (filters.kind === 'expense') {
    return appData.activeExpenseCategories.value
  }

  if (filters.kind === 'income') {
    return appData.activeIncomeCategories.value
  }

  if (filters.kind === 'saving') {
    return savingCategories
  }

  return [
    ...appData.activeExpenseCategories.value.map((category) => ({
      ...category,
      kind: 'expense' as const,
    })),
    ...appData.activeIncomeCategories.value.map((category) => ({
      ...category,
      kind: 'income' as const,
    })),
    ...savingCategories.map((category) => ({ ...category, kind: 'saving' as const })),
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
  for (const trip of appData.trips.value) {
    map.set(trip.trip_id, `${trip.name}｜${trip.destination}`)
  }
  return map
})

const baseTransactions = computed(() => {
  if (filters.tripId === 'all') {
    return appData.combinedTransactions.value
  }

  if (filters.tripId === 'unassigned') {
    return appData.unassignedTransactions.value
  }

  if (filters.tripId === appData.activeTripId.value) {
    return appData.tripTransactions.value
  }

  return appData.combinedTransactions.value.filter(
    (transaction) => transaction.trip_id === filters.tripId,
  )
})

const filteredTransactions = computed(() => {
  const query = search.value.trim().toLowerCase()

  return baseTransactions.value.filter((transaction) => {
    if (query && !transaction.name.toLowerCase().includes(query)) {
      return false
    }

    if (filters.kind !== 'all' && transaction.kind !== filters.kind) {
      return false
    }

    if (filters.categoryId !== 'all' && transaction.category_id !== filters.categoryId) {
      return false
    }

    if (filters.datePreset === 'today') {
      if (transaction.date < todayWindow.value.start || transaction.date >= todayWindow.value.end) {
        return false
      }
    }

    if (filters.datePreset === 'cycle') {
      const window = appData.currentWindow.value
      if (!window || transaction.date < window.start || transaction.date >= window.end) {
        return false
      }
    }

    if (filters.datePreset === 'future' && transaction.date < todayWindow.value.end) {
      return false
    }

    return true
  })
})

const groupedTransactions = computed(() => {
  const groups = new Map<string, CombinedTransaction[]>()
  const now = Date.now()
  const today = startOfLocalDay(new Date())
  const yesterday = today - 86_400_000
  const oneWeekAgo = today - 7 * 86_400_000

  for (const transaction of filteredTransactions.value) {
    const date = startOfLocalDay(new Date(transaction.date))
    let label: string

    if (date === today) {
      label = '今天'
    } else if (date === yesterday) {
      label = '昨天'
    } else if (date > oneWeekAgo) {
      label = new Intl.DateTimeFormat('zh-HK', { month: 'long', day: 'numeric' }).format(
        new Date(date),
      )
    } else {
      label = '更早'
    }

    const existing = groups.get(label)
    if (existing) {
      existing.push(transaction)
    } else {
      groups.set(label, [transaction])
    }
  }

  // Preserve chronological order by first transaction in each group.
  const entries = [...groups.entries()].map(([label, items]) => ({
    label,
    items,
    firstDate: items[items.length - 1]?.date ?? now,
  }))

  entries.sort((a, b) => b.firstDate - a.firstDate)

  return entries
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

watch(
  () => appData.activeTripId.value,
  (activeTripId) => {
    filters.tripId = activeTripId || 'all'
  },
  { immediate: true },
)

watch(
  () => appData.trips.value,
  (trips) => {
    if (filters.tripId === 'all' || filters.tripId === 'unassigned') {
      return
    }

    if (!trips.some((trip) => trip.trip_id === filters.tripId)) {
      filters.tripId = appData.activeTripId.value || 'all'
    }
  },
  { immediate: true },
)

watch(
  () => filters.kind,
  () => {
    filters.categoryId = 'all'
  },
)

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

function resetFilters(): void {
  filters.tripId = appData.activeTripId.value || 'all'
  filters.kind = 'all'
  filters.categoryId = 'all'
  filters.datePreset = 'all'
  search.value = ''
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
  filters.datePreset = value
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
          <BaseInput v-model="search" placeholder="搜尋交易名稱" type="search" inputmode="search" />
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

        <div v-if="appData.trips.value.length" class="grid gap-1.5">
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
              v-for="trip in appData.trips.value"
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
          @click="resetFilters"
        >
          清除全部
        </button>
      </div>
    </section>

    <section class="grid gap-4">
      <div v-if="groupedTransactions.length" class="space-y-4">
        <TransactionDateGroup
          v-for="group in groupedTransactions"
          :key="group.label"
          :label="group.label"
          :items="group.items"
          :expense-categories="appData.data.value.expenseCategories"
          :income-categories="appData.data.value.incomeCategories"
          :currency="appData.currency.value"
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
      :expense-categories="appData.activeExpenseCategories.value"
      :income-categories="appData.activeIncomeCategories.value"
      :saving-challenges="appData.savingChallenges.value"
      :trip-options="appData.trips.value"
      :default-trip-id="appData.activeTripId.value || undefined"
      :fx-rate-map="appData.fxRateMap.value"
      :latest-fx-date="appData.latestFxDate.value"
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
