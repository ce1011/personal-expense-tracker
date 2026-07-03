<script setup lang="ts">
import { computed, nextTick, reactive, shallowRef, watch } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import { useAppData } from '@/composables/useAppData'
import { fromDateInputValue } from '@/lib/date'
import { savingCategories } from '@/lib/savingCategories'
import type { CombinedTransaction, ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const search = shallowRef('')
const selectedTransaction = shallowRef<CombinedTransaction | undefined>()
const filters = reactive({
  tripId: 'all',
  kind: 'all' as 'all' | 'expense' | 'income' | 'saving',
  categoryId: 'all',
  datePreset: 'all' as 'all' | 'today' | 'cycle' | 'future',
  fromDate: '',
  toDate: '',
})

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
  const fromTimestamp = filters.fromDate ? fromDateInputValue(filters.fromDate) : undefined
  const toTimestamp = filters.toDate ? fromDateInputValue(filters.toDate) + 86_400_000 : undefined

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

    if (fromTimestamp !== undefined && transaction.date < fromTimestamp) {
      return false
    }

    if (toTimestamp !== undefined && transaction.date >= toTimestamp) {
      return false
    }

    return true
  })
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

function addExpense(draft: ExpenseDraft): void {
  void appData.addExpense(draft)
}

function addIncome(draft: IncomeDraft): void {
  void appData.addIncome(draft)
}

function addSaving(draft: SavingDraft): void {
  void appData.addSaving(draft)
}

function startEditing(transaction: CombinedTransaction): void {
  selectedTransaction.value = transaction
  void nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function cancelEditing(): void {
  selectedTransaction.value = undefined
}

function updateExpense(transactionId: string, draft: ExpenseDraft): void {
  void appData.updateExpense(transactionId, draft).then(cancelEditing)
}

function updateIncome(transactionId: string, draft: IncomeDraft): void {
  void appData.updateIncome(transactionId, draft).then(cancelEditing)
}

function updateSaving(transactionId: string, draft: SavingDraft): void {
  void appData.updateSaving(transactionId, draft).then(cancelEditing)
}

function deleteTransaction(transaction: CombinedTransaction): void {
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

  void action.then(() => {
    if (selectedTransaction.value?.id === transaction.id) {
      cancelEditing()
    }
  })
}

function deleteSelectedTransaction(): void {
  if (!selectedTransaction.value) {
    return
  }

  deleteTransaction(selectedTransaction.value)
}

function resetFilters(): void {
  filters.tripId = appData.activeTripId.value || 'all'
  filters.kind = 'all'
  filters.categoryId = 'all'
  filters.datePreset = 'all'
  filters.fromDate = ''
  filters.toDate = ''
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">流水帳</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">交易紀錄</h1>
    </section>

    <TransactionForm
      v-if="selectedTransaction"
      :key="`edit-${selectedTransaction.id}`"
      :expense-categories="appData.activeExpenseCategories.value"
      :income-categories="appData.activeIncomeCategories.value"
      :saving-challenges="appData.savingChallenges.value"
      :trip-options="appData.trips.value"
      :default-trip-id="appData.activeTripId.value || undefined"
      :fx-rate-map="appData.fxRateMap.value"
      :latest-fx-date="appData.latestFxDate.value"
      :transaction="selectedTransaction"
      @update-expense="updateExpense"
      @update-income="updateIncome"
      @update-saving="updateSaving"
      @delete-transaction="deleteSelectedTransaction"
      @cancel-edit="cancelEditing"
    />
    <TransactionForm
      v-else
      key="create"
      :expense-categories="appData.activeExpenseCategories.value"
      :income-categories="appData.activeIncomeCategories.value"
      :saving-challenges="appData.savingChallenges.value"
      :trip-options="appData.trips.value"
      :default-trip-id="appData.activeTripId.value || undefined"
      :fx-rate-map="appData.fxRateMap.value"
      :latest-fx-date="appData.latestFxDate.value"
      @create-expense="addExpense"
      @create-income="addIncome"
      @create-saving="addSaving"
    />

    <section class="grid gap-3">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        搜尋交易
        <input
          v-model="search"
          class="rounded-md border border-stone-300 bg-white px-3 py-2"
          placeholder="按名稱搜尋"
        />
      </label>

      <div
        class="grid gap-3 rounded-md border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-6"
      >
        <label class="grid gap-1 text-sm font-medium text-stone-700">
          旅程
          <select
            v-model="filters.tripId"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="all">全部交易</option>
            <option value="unassigned">未關聯旅程</option>
            <option v-for="trip in appData.trips.value" :key="trip.trip_id" :value="trip.trip_id">
              {{ trip.name }}｜{{ trip.destination }}
            </option>
          </select>
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          類型
          <select
            v-model="filters.kind"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="all">全部</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
            <option value="saving">儲蓄</option>
          </select>
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          分類
          <select
            v-model="filters.categoryId"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="all">全部分類</option>
            <option
              v-for="category in availableCategories"
              :key="
                'kind' in category
                  ? `${category.kind}-${category.category_id}`
                  : category.category_id
              "
              :value="category.category_id"
            >
              {{ category.name_tc || category.name_en }}
            </option>
          </select>
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          時間快捷
          <select
            v-model="filters.datePreset"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="all">全部</option>
            <option value="today">今天</option>
            <option value="cycle">本期</option>
            <option value="future">未來</option>
          </select>
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          開始日期
          <input
            v-model="filters.fromDate"
            type="date"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          結束日期
          <input
            v-model="filters.toDate"
            type="date"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          @click="resetFilters"
        >
          清除篩選
        </button>
      </div>

      <TransactionList
        v-if="filteredTransactions.length"
        :items="filteredTransactions"
        :expense-categories="appData.data.value.expenseCategories"
        :income-categories="appData.data.value.incomeCategories"
        :currency="appData.currency.value"
        show-actions
        @edit="startEditing"
        @delete="deleteTransaction"
      />
      <EmptyState v-else title="找不到交易" message="試試其他關鍵字，或先新增一筆交易。" />
    </section>
  </div>
</template>
