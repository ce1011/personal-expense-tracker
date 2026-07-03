<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { MapPinned, Plus, Route } from 'lucide-vue-next'

import EmptyState from '@/components/common/EmptyState.vue'
import { useAppData } from '@/composables/useAppData'
import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { SupportedCurrency, TripDraft, TripSession, TripStatus } from '@/types/app-data'

const appData = useAppData()

const selectedTripId = shallowRef('')
const form = reactive({
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  budgetAmount: 0,
  budgetCurrency: 'HKD' as SupportedCurrency,
  status: 'planned' as TripStatus,
  notes: '',
})

const selectedTrip = computed(() =>
  appData.trips.value.find((trip) => trip.trip_id === selectedTripId.value),
)

const tripOptions = [
  { value: 'HKD', label: '港幣 HKD' },
  { value: 'JPY', label: '日圓 JPY' },
  { value: 'USD', label: '美元 USD' },
  { value: 'CNY', label: '人民幣 CNY' },
  { value: 'TWD', label: '台幣 TWD' },
  { value: 'THB', label: '泰銖 THB' },
] as const

watch(
  () => appData.trips.value,
  (trips) => {
    if (!selectedTripId.value && trips.length) {
      selectedTripId.value = trips[0]?.trip_id ?? ''
      return
    }

    if (selectedTripId.value && !trips.some((trip) => trip.trip_id === selectedTripId.value)) {
      selectedTripId.value = trips[0]?.trip_id ?? ''
    }
  },
  { immediate: true },
)

watch(
  selectedTrip,
  (trip) => {
    if (!trip) {
      resetForm('planned')
      return
    }

    form.name = trip.name
    form.destination = trip.destination
    form.startDate = toDateInputValue(trip.start_date)
    form.endDate = toDateInputValue(trip.end_date)
    form.budgetAmount = trip.budget_amount
    form.budgetCurrency = trip.budget_currency
    form.status = trip.status
    form.notes = trip.notes
  },
  { immediate: true },
)

const tripCards = computed(() =>
  appData.trips.value.map((trip) => ({
    ...trip,
    isActive: appData.activeTripId.value === trip.trip_id,
    summary: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
  })),
)
const canSaveTrip = computed(() => Boolean(toTripDraft()))

function resetForm(status: TripStatus): void {
  form.name = ''
  form.destination = ''
  form.startDate = ''
  form.endDate = ''
  form.budgetAmount = 0
  form.budgetCurrency = 'HKD'
  form.status = status
  form.notes = ''
}

function startCreateTrip(): void {
  selectedTripId.value = ''
  resetForm('planned')
}

function selectTrip(tripId: string): void {
  selectedTripId.value = tripId
}

function toTripDraft(): TripDraft | undefined {
  if (!form.name.trim() || !form.destination.trim() || !form.startDate || !form.endDate) {
    return undefined
  }

  const startDate = fromDateInputValue(form.startDate)
  const endDate = fromDateInputValue(form.endDate)

  if (endDate < startDate) {
    return undefined
  }

  return {
    name: form.name.trim(),
    destination: form.destination.trim(),
    start_date: startDate,
    end_date: endDate,
    budget_amount: Math.max(0, form.budgetAmount),
    budget_currency: form.budgetCurrency,
    status: form.status,
    notes: form.notes.trim(),
  }
}

function saveTrip(): void {
  const draft = toTripDraft()

  if (!draft) {
    return
  }

  if (selectedTrip.value) {
    void appData.updateTrip(selectedTrip.value.trip_id, draft)
    return
  }

  void appData.addTrip(draft)
}

function setTripMode(tripId?: string): void {
  if (!tripId) {
    void appData.clearActiveTrip()
    return
  }

  void appData.setActiveTrip(tripId)
}

function completeSelectedTrip(): void {
  if (!selectedTrip.value || selectedTrip.value.status === 'completed') {
    return
  }

  const confirmed =
    globalThis.confirm?.(`確定把「${selectedTrip.value.name}」標記為已完成嗎？`) ?? true

  if (!confirmed) {
    return
  }

  void appData.completeTrip(selectedTrip.value.trip_id)
}

function getStatusLabel(status: TripStatus): string {
  return status === 'planned' ? '規劃中' : status === 'active' ? '進行中' : '已完成'
}

function getStatusClasses(status: TripStatus): string {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-900'
  }

  if (status === 'completed') {
    return 'bg-stone-200 text-stone-700'
  }

  return 'bg-amber-100 text-amber-900'
}

function statusHint(trip: TripSession): string {
  if (trip.status === 'completed') {
    return '這個旅程已完成，仍可查看與微調內容。'
  }

  if (appData.activeTripId.value === trip.trip_id) {
    return '目前已套用到記帳與總覽旅程模式。'
  }

  return '可設為目前旅程，讓交易與總覽聚焦這次旅程。'
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">旅程模式</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">旅程管理</h1>
      <p class="mt-2 max-w-3xl text-sm text-stone-600">
        在這裡建立每次旅程的期間、預算和備註，之後就可以從側欄或手機頂部切換到指定旅程模式，集中查看相關收支。
      </p>
    </section>

    <section class="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div class="grid gap-4">
        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-stone-950">旅程清單</h2>
              <p class="mt-1 text-sm text-stone-500">
                已儲存 {{ appData.trips.value.length }} 個旅程
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
              @click="startCreateTrip"
            >
              <Plus class="size-4" aria-hidden="true" />
              新增
            </button>
          </div>

          <div v-if="tripCards.length" class="mt-4 grid gap-2">
            <button
              v-for="trip in tripCards"
              :key="trip.trip_id"
              type="button"
              class="rounded-md border px-3 py-3 text-left transition"
              :class="
                trip.trip_id === selectedTripId
                  ? 'border-emerald-700 bg-emerald-50'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              "
              @click="selectTrip(trip.trip_id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-stone-950">{{ trip.name }}</p>
                  <p class="mt-1 text-sm text-stone-600">{{ trip.destination }}</p>
                </div>
                <span
                  class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="getStatusClasses(trip.status)"
                >
                  {{ getStatusLabel(trip.status) }}
                </span>
              </div>
              <p class="mt-3 text-xs text-stone-500">{{ trip.summary }}</p>
              <p class="mt-1 text-xs text-stone-500">
                {{ formatCurrency(trip.budget_amount, trip.budget_currency) }}
              </p>
              <p v-if="trip.isActive" class="mt-2 text-xs font-semibold text-emerald-800">
                目前旅程模式
              </p>
            </button>
          </div>

          <EmptyState
            v-else
            class="mt-4"
            title="尚未建立旅程"
            message="新增第一個旅程後，就可以把交易綁定到指定旅程，並在 shell 快速切換模式。"
          />
        </section>

        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-stone-950">目前模式</h2>
              <p class="mt-1 text-sm text-stone-500">
                {{
                  appData.activeTrip.value
                    ? `${appData.activeTrip.value.name} · ${appData.activeTrip.value.destination}`
                    : '一般模式'
                }}
              </p>
            </div>
            <Route class="size-5 text-emerald-800" aria-hidden="true" />
          </div>

          <div class="mt-4 grid gap-2">
            <button
              type="button"
              class="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              @click="setTripMode()"
            >
              切換回一般模式
            </button>
            <button
              v-if="selectedTrip"
              type="button"
              class="rounded-md bg-stone-900 px-3 py-2 text-sm font-semibold text-white"
              @click="setTripMode(selectedTrip.trip_id)"
            >
              設為目前旅程
            </button>
          </div>
        </section>
      </div>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">
              {{ selectedTrip ? '編輯旅程' : '新增旅程' }}
            </p>
            <h2 class="mt-1 text-2xl font-semibold text-stone-950">
              {{ selectedTrip ? selectedTrip.name : '建立新的旅程 Session' }}
            </h2>
            <p class="mt-2 text-sm text-stone-500">
              {{
                selectedTrip
                  ? statusHint(selectedTrip)
                  : '建立後可再設為目前旅程，讓交易與總覽聚焦在這段行程。'
              }}
            </p>
          </div>
          <MapPinned class="size-5 text-stone-700" aria-hidden="true" />
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            旅程名稱
            <input
              v-model.trim="form.name"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
              placeholder="例如：東京賞櫻"
            />
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700">
            目的地
            <input
              v-model.trim="form.destination"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
              placeholder="例如：東京"
            />
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700">
            開始日期
            <input
              v-model="form.startDate"
              type="date"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700">
            結束日期
            <input
              v-model="form.endDate"
              type="date"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700">
            預算金額
            <input
              v-model.number="form.budgetAmount"
              min="0"
              type="number"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700">
            預算幣別
            <select
              v-model="form.budgetCurrency"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
            >
              <option v-for="option in tripOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700 md:col-span-2">
            狀態
            <select
              v-model="form.status"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
            >
              <option value="planned">規劃中</option>
              <option value="active">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </label>

          <label class="grid gap-1 text-sm font-medium text-stone-700 md:col-span-2">
            備註
            <textarea
              v-model.trim="form.notes"
              rows="5"
              class="rounded-md border border-stone-300 bg-white px-3 py-2"
              placeholder="例如：機票已付款、住宿另算、記得保留現金預算"
            />
          </label>
        </div>

        <div class="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          <p v-if="selectedTrip">
            旅程期間：{{ formatDate(selectedTrip.start_date) }} -
            {{ formatDate(selectedTrip.end_date) }}
          </p>
          <p v-else>建立後可從 app shell 切換成這個旅程模式，專注查看相關交易。</p>
          <p class="mt-1 text-xs text-stone-500">
            若結束日期早於開始日期，系統不會儲存這筆旅程設定。
          </p>
          <p v-if="!canSaveTrip" class="mt-1 text-xs text-amber-700">
            請填妥名稱、目的地、日期，並確認結束日期不早於開始日期。
          </p>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
            :disabled="!canSaveTrip"
            @click="saveTrip"
          >
            {{ selectedTrip ? '儲存旅程' : '建立旅程' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            @click="startCreateTrip"
          >
            清空表單
          </button>
          <button
            v-if="selectedTrip"
            type="button"
            class="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
            :disabled="selectedTrip.status === 'completed'"
            @click="completeSelectedTrip"
          >
            標記為已完成
          </button>
        </div>
      </section>
    </section>
  </div>
</template>
