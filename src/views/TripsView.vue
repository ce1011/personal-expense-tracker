<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { CheckCircle2, ChevronDown, Globe, MapPinned, PenLine, Plus, Route } from 'lucide-vue-next'

import UiBottomSheet from '@/components/ui/UiBottomSheet.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import UiDateRangePicker from '@/components/ui/UiDateRangePicker.vue'
import UiDropdownMenu from '@/components/ui/UiDropdownMenu.vue'
import UiNumberField from '@/components/ui/UiNumberField.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import TripBudgetHelperCard from '@/components/trips/TripBudgetHelperCard.vue'
import { useAppData } from '@/composables/useAppData'
import { useTripsData } from '@/composables/useTripsData'
import { fromDateInputValue, toDateInputValue } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { SupportedCurrency, TripDraft, TripSession, TripStatus } from '@/types/app-data'

const appData = useAppData()
const { trips, activeTripId, activeTrip, tripBudgetHelper, spentInTrip, currency, loading } =
  useTripsData()

const isSheetOpen = shallowRef(false)
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

const tripDateRange = computed({
  get() {
    return { start: form.startDate, end: form.endDate }
  },
  set(value: { start: string; end: string }) {
    form.startDate = value.start
    form.endDate = value.end
  },
})

const selectedTrip = computed(() =>
  trips.value.find((trip) => trip.trip_id === selectedTripId.value),
)
const isEditing = computed(() => Boolean(selectedTrip.value))

const tripOptions = [
  { value: 'HKD', label: '港幣 HKD' },
  { value: 'JPY', label: '日圓 JPY' },
  { value: 'USD', label: '美元 USD' },
  { value: 'CNY', label: '人民幣 CNY' },
  { value: 'TWD', label: '台幣 TWD' },
  { value: 'THB', label: '泰銖 THB' },
]

const statusOptions = [
  { value: 'planned', label: '規劃中' },
  { value: 'active', label: '進行中' },
  { value: 'completed', label: '已完成' },
]

const modeOptions = computed(() => [
  { value: 'all', label: '一般模式' },
  ...trips.value.map((trip) => ({
    value: trip.trip_id,
    label: `${trip.name} · ${trip.destination}`,
  })),
])

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
  trips.value.map((trip) => ({
    ...trip,
    isActive: activeTripId.value === trip.trip_id,
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

function openCreate(): void {
  selectedTripId.value = ''
  resetForm('planned')
  isSheetOpen.value = true
}

function openEdit(tripId: string): void {
  selectedTripId.value = tripId
  isSheetOpen.value = true
}

function closeSheet(): void {
  isSheetOpen.value = false
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
    void appData.updateTrip(selectedTrip.value.trip_id, draft).then(closeSheet)
    return
  }

  void appData.addTrip(draft).then(closeSheet)
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

  void appData.completeTrip(selectedTrip.value.trip_id).then(closeSheet)
}

function getStatusLabel(status: TripStatus): string {
  return status === 'planned' ? '規劃中' : status === 'active' ? '進行中' : '已完成'
}

function getStatusClasses(status: TripStatus): string {
  if (status === 'active') {
    return 'bg-primary/10 text-primary'
  }

  if (status === 'completed') {
    return 'bg-text-3/10 text-text-2'
  }

  return 'bg-warning/10 text-warning'
}

function statusHint(trip: TripSession): string {
  if (trip.status === 'completed') {
    return '這個旅程已完成，仍可查看與微調內容。'
  }

  if (activeTripId.value === trip.trip_id) {
    return '目前已套用到記帳與總覽旅程模式。'
  }

  return '可設為目前旅程，讓交易與總覽聚焦這次旅程。'
}

function selectMode(tripId: string): void {
  setTripMode(tripId === 'all' ? undefined : tripId)
}
</script>

<template>
  <div class="grid gap-4">
    <header class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">旅程模式</p>
        <h1 class="mt-1 text-h1 font-bold text-text">旅程管理</h1>
        <p class="mt-1 max-w-3xl text-body-sm text-text-2">
          建立每次旅程的期間、預算和備註，之後就可以從頂部切換到指定旅程模式，集中查看相關收支。
        </p>
      </div>

      <UiDropdownMenu
        :items="modeOptions.map((option) => ({ key: option.value, label: option.label }))"
        @select="selectMode"
      >
        <template #trigger>
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-body-sm font-semibold text-text"
          >
            <Route class="size-4 text-primary" aria-hidden="true" />
            {{ activeTrip?.name ?? '一般模式' }}
            <ChevronDown class="size-4 text-text-3" aria-hidden="true" />
          </button>
        </template>
      </UiDropdownMenu>
    </header>

    <BaseButton class="w-full sm:w-auto" @click="openCreate">
      <Plus class="size-4" aria-hidden="true" />
      新增旅程
    </BaseButton>

    <TripBudgetHelperCard v-if="activeTrip" :helper="tripBudgetHelper" :currency="currency" />

    <SkeletonList v-if="loading" :rows="4" />

    <BaseCard v-else-if="tripCards.length">
      <h2 class="text-h3 font-semibold text-text">旅程列表</h2>
      <p class="text-body-sm text-text-2">已儲存 {{ trips.length }} 個旅程</p>

      <div class="mt-4 grid gap-3">
        <button
          v-for="trip in tripCards"
          :key="trip.trip_id"
          type="button"
          class="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/50"
          @click="openEdit(trip.trip_id)"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
              :class="getStatusClasses(trip.status)"
            >
              <Globe class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-body-sm font-semibold text-text">{{ trip.name }}</p>
                <span
                  v-if="trip.isActive"
                  class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                >
                  目前旅程
                </span>
              </div>
              <p class="text-caption text-text-2">
                {{ trip.destination }} · {{ formatDate(trip.start_date) }} -
                {{ formatDate(trip.end_date) }}
              </p>
              <p class="text-caption text-text-2">
                預算 {{ formatCurrency(trip.budget_amount, trip.budget_currency) }} · 已用
                {{ formatCurrency(spentInTrip(trip.trip_id), currency) }}
              </p>
            </div>
          </div>

          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="getStatusClasses(trip.status)"
          >
            {{ getStatusLabel(trip.status) }}
          </span>
        </button>
      </div>
    </BaseCard>

    <EmptyState
      v-else
      :icon="MapPinned"
      title="尚未建立旅程"
      message="新增第一個旅程後，就可以把交易綁定到指定旅程，並在頂部快速切換模式。"
    >
      <template #action>
        <BaseButton class="mt-5 w-full" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          新增旅程
        </BaseButton>
      </template>
    </EmptyState>

    <UiBottomSheet
      :show="isSheetOpen"
      :title="isEditing ? '編輯旅程' : '新增旅程'"
      :subtitle="
        isEditing ? statusHint(selectedTrip!) : '建立後可設為目前旅程，讓交易與總覽聚焦在這段行程。'
      "
      @close="closeSheet"
    >
      <form class="grid gap-4" @submit.prevent="saveTrip">
        <div class="grid gap-3 sm:grid-cols-2">
          <BaseInput v-model.trim="form.name" label="旅程名稱" placeholder="例如：東京賞櫻" />
          <BaseInput v-model.trim="form.destination" label="目的地" placeholder="例如：東京" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <UiDateRangePicker v-model="tripDateRange" label="旅程期間" />
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UiNumberField v-model="form.budgetAmount" label="預算金額" :min="0" :step="0.01" />
          <UiSelect v-model="form.budgetCurrency" label="預算幣別" :options="tripOptions" />
        </div>

        <UiSelect v-model="form.status" label="狀態" :options="statusOptions" />

        <label class="grid gap-1 text-sm font-medium text-text-2">
          備註
          <textarea
            v-model.trim="form.notes"
            rows="4"
            class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-text placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="例如：機票已付款、住宿另算、記得保留現金預算"
          />
        </label>

        <BaseCard v-if="selectedTrip" variant="primary">
          <p class="text-body-sm text-text-2">
            旅程期間：{{ formatDate(selectedTrip.start_date) }} -
            {{ formatDate(selectedTrip.end_date) }}
          </p>
        </BaseCard>

        <p v-if="!canSaveTrip" class="text-body-sm text-warning">
          請填妥名稱、目的地、日期，並確認結束日期不早於開始日期。
        </p>

        <div class="flex flex-col gap-2 pt-2 sm:flex-row">
          <BaseButton type="submit" :disabled="!canSaveTrip">
            <PenLine class="size-4" aria-hidden="true" />
            {{ isEditing ? '儲存旅程' : '建立旅程' }}
          </BaseButton>
          <BaseButton
            v-if="isEditing"
            variant="secondary"
            type="button"
            @click="completeSelectedTrip"
          >
            <CheckCircle2 class="size-4" aria-hidden="true" />
            標記為已完成
          </BaseButton>
        </div>
      </form>
    </UiBottomSheet>
  </div>
</template>
