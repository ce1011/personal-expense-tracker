<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, Plane } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import SyncPulse from '@/components/layout/SyncPulse.vue'
import { useAppData } from '@/composables/useAppData'
import { getCycleWindow } from '@/lib/budgetCycle'
import type { BudgetCycle, TripStatus } from '@/types/app-data'

const props = defineProps<{
  currentCycle?: BudgetCycle
  loading: boolean
}>()

const appData = useAppData()
const route = useRoute()
const showTripMenu = ref(false)
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
  showTripMenu.value = false

  if (tripId === 'all') {
    void appData.clearActiveTrip()
    return
  }

  void appData.setActiveTrip(tripId)
}

function getTripStatusLabel(status: TripStatus): string {
  return status === 'planned' ? '規劃中' : status === 'active' ? '進行中' : '已完成'
}

function toggleTripMenu(): void {
  showTripMenu.value = !showTripMenu.value
}

function closeTripMenu(): void {
  showTripMenu.value = false
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

        <div v-if="hasTrips" class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1.5 text-xs font-medium text-text-2 shadow-sm transition hover:bg-surface"
            aria-label="切換旅程模式"
            @click="toggleTripMenu"
          >
            <Plane class="size-3.5 text-primary" aria-hidden="true" />
            <span class="hidden sm:inline">{{ tripModeLabel }}</span>
            <ChevronDown class="size-3.5 text-text-3" aria-hidden="true" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="showTripMenu"
              class="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl"
            >
              <div class="px-2 py-1.5">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-3">
                  旅程模式
                </p>
                <p class="mt-1 text-sm font-semibold text-text">{{ tripModeLabel }}</p>
                <p class="text-xs text-text-2">{{ tripSummaryLabel }}</p>
              </div>
              <hr class="my-1 border-border" />
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-2 transition hover:bg-accent"
                :class="{ 'bg-accent text-text': !appData.activeTripId.value }"
                @click="handleTripSelection('all')"
              >
                <span class="size-2 rounded-full bg-border" />
                一般模式
              </button>
              <button
                v-for="trip in appData.trips.value"
                :key="trip.trip_id"
                type="button"
                class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-2 transition hover:bg-accent"
                :class="{ 'bg-accent text-text': appData.activeTripId.value === trip.trip_id }"
                @click="handleTripSelection(trip.trip_id)"
              >
                <span
                  class="size-2 rounded-full"
                  :class="trip.status === 'active' ? 'bg-primary' : 'bg-text-3'"
                />
                {{ trip.name }}｜{{ trip.destination }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div
      v-if="showTripMenu"
      class="fixed inset-0 z-20 bg-transparent"
      aria-hidden="true"
      @click="closeTripMenu"
    />
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
