<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, Plane } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import SyncPulse from '@/components/layout/SyncPulse.vue'
import UiDropdownMenu from '@/components/ui/UiDropdownMenu.vue'
import { useAppData } from '@/composables/useAppData'
import { getCycleWindow } from '@/lib/budgetCycle'
import type { BudgetCycle, TripStatus } from '@/types/app-data'

const props = defineProps<{
  currentCycle?: BudgetCycle
  loading: boolean
}>()

const appData = useAppData()
const route = useRoute()
const pageTitle = computed(() => String(route.meta.title ?? '總覽'))

const cycleLabel = computed(() => {
  if (!props.currentCycle) {
    return '尚未建立預算週期'
  }

  return `${props.currentCycle.cycle_code} · ${getCycleWindow(props.currentCycle.cycle_code, props.currentCycle.income_day).label}`
})

const tripModeLabel = computed(() => appData.activeTrip.value?.name ?? '一般模式')
const hasTrips = computed(() => appData.trips.value.length > 0)

const tripSummaryLabel = computed(() => {
  if (!appData.trips.value.length) {
    return '尚未建立旅程'
  }

  if (!appData.activeTrip.value) {
    return `可切換 ${appData.trips.value.length} 個旅程`
  }

  return `${appData.activeTrip.value.destination} · ${getTripStatusLabel(appData.activeTrip.value.status)}`
})

function handleTripSelection(tripId: string): void {
  if (tripId === 'all') {
    void appData.clearActiveTrip()
    return
  }

  void appData.setActiveTrip(tripId)
}

const tripMenuItems = computed(() => [
  {
    key: 'all',
    label: '一般模式',
    description: '查看全部收支',
  },
  ...appData.trips.value.map((trip) => ({
    key: trip.trip_id,
    label: `${trip.name}｜${trip.destination}`,
    description: getTripStatusLabel(trip.status),
  })),
])

function getTripStatusLabel(status: TripStatus): string {
  return status === 'planned' ? '規劃中' : status === 'active' ? '進行中' : '已完成'
}

</script>

<template>
  <header class="app-header safe-top sticky top-0 z-20 px-4 py-3">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-2">
          個人收支追蹤
        </p>
        <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight text-text">{{ pageTitle }}</h1>
        <p class="mt-0.5 hidden truncate text-[11px] font-medium text-text-3 sm:block">
          {{ cycleLabel }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <SyncPulse :page-loading="loading" />

        <UiDropdownMenu
          v-if="hasTrips"
          :items="tripMenuItems"
          @select="handleTripSelection"
        >
          <template #trigger>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1.5 text-xs font-medium text-text-2 shadow-sm transition hover:bg-surface"
              aria-label="切換旅程模式"
            >
              <Plane class="size-3.5 text-primary" aria-hidden="true" />
              <span class="hidden sm:inline">{{ tripModeLabel }}</span>
              <ChevronDown class="size-3.5 text-text-3" aria-hidden="true" />
            </button>
          </template>
          <template #header>
            <div class="px-2 py-1.5">
              <p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-3">旅程模式</p>
              <p class="mt-1 text-sm font-semibold text-text">{{ tripModeLabel }}</p>
              <p class="text-xs text-text-2">{{ tripSummaryLabel }}</p>
            </div>
          </template>
        </UiDropdownMenu>
      </div>
    </div>

    <span class="app-header__rail" :class="{ 'app-header__rail--active': loading }" />
  </header>
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 9%, transparent);
  background: color-mix(in srgb, var(--color-bg) 86%, transparent);
  box-shadow: 0 8px 30px rgb(67 40 119 / 5%);
  backdrop-filter: blur(22px) saturate(135%);
}

.app-header__rail {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 200ms ease;
}

.app-header__rail::after {
  position: absolute;
  width: 35%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-primary),
    var(--color-info),
    transparent
  );
  content: '';
  transform: translateX(-120%);
}

.app-header__rail--active {
  opacity: 1;
}

.app-header__rail--active::after {
  animation: sync-rail 1.25s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

@keyframes sync-rail {
  to {
    transform: translateX(385%);
  }
}
</style>
