<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArchiveRestore, ChartNoAxesCombined, ChartPie, FolderKanban, LayoutDashboard, ListChecks } from 'lucide-vue-next'

import { getCycleWindow } from '@/lib/budgetCycle'
import type { BudgetCycle } from '@/types/app-data'

const props = defineProps<{
  cycles: readonly BudgetCycle[]
  currentCycle?: BudgetCycle
  loading: boolean
}>()

const navItems = [
  { label: '總覽', to: '/', icon: LayoutDashboard },
  { label: '交易', to: '/transactions', icon: ListChecks },
  { label: '預算週期', to: '/budgets', icon: ChartNoAxesCombined },
  { label: '分類預算', to: '/category-budget', icon: ChartPie },
  { label: '分類', to: '/categories', icon: FolderKanban },
  { label: '設定', to: '/settings', icon: ArchiveRestore },
]

const cycleLabel = computed(() => {
  if (!props.currentCycle) {
    return '尚未建立預算週期'
  }

  return `${props.currentCycle.cycle_code} · ${
    getCycleWindow(props.currentCycle.cycle_code, props.currentCycle.income_day).label
  }`
})
</script>

<template>
  <div class="min-h-screen text-stone-900">
    <aside
      class="fixed inset-y-0 left-0 hidden w-68 border-r border-stone-200/80 bg-[#f9f6ef]/90 px-5 py-5 shadow-sm backdrop-blur xl:block"
    >
      <div class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">個人理財</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-stone-950">個人收支追蹤</h1>
      </div>

      <nav class="space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-white hover:text-stone-950"
          active-class="bg-white text-emerald-900 shadow-sm"
        >
          <component :is="item.icon" class="size-4" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="mt-8 rounded-md border border-stone-200 bg-white p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">目前週期</p>
        <p class="mt-2 text-sm font-semibold text-stone-950">{{ cycleLabel }}</p>
        <p class="mt-1 text-xs text-stone-500">已儲存 {{ cycles.length }} 個週期</p>
      </div>
    </aside>

    <div class="xl:pl-68">
      <header class="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f9f6ef]/95 px-4 py-3 backdrop-blur xl:hidden">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">個人收支追蹤</p>
            <p class="text-sm font-medium text-stone-700">{{ cycleLabel }}</p>
          </div>
          <p v-if="loading" class="text-xs font-medium text-stone-500">載入中</p>
        </div>
        <nav class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex shrink-0 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
            active-class="border-emerald-700 text-emerald-900"
          >
            <component :is="item.icon" class="size-4" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </header>

      <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
