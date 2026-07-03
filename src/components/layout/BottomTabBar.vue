<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChartPie, LayoutDashboard, ListChecks, PlusCircle, Settings2 } from 'lucide-vue-next'

const emit = defineEmits<{
  quickAdd: []
}>()

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: '總覽', to: '/', icon: LayoutDashboard, name: 'dashboard' },
  { label: '交易', to: '/transactions', icon: ListChecks, name: 'transactions' },
  { label: '記一筆', action: 'quick-add' as const, icon: PlusCircle, name: 'quick-add' },
  { label: '預算', to: '/category-budget', icon: ChartPie, name: 'category-budget' },
  { label: '更多', to: '/settings', icon: Settings2, name: 'settings' },
]

const activeName = computed(() => route.name?.toString() ?? '')

function isActive(tabName: string): boolean {
  return activeName.value === tabName
}

function handleTabClick(tab: (typeof tabs)[number]): void {
  if (tab.action === 'quick-add') {
    emit('quickAdd')
    return
  }

  void router.push(tab.to)
}
</script>

<template>
  <nav
    class="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    aria-label="主要導航"
  >
    <div class="mx-auto flex max-w-md items-end justify-around">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        type="button"
        class="group flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition"
        :class="
          tab.action === 'quick-add'
            ? 'relative -top-3 mb-1 rounded-full bg-primary px-3 text-white shadow-md hover:bg-primary-2'
            : isActive(tab.name)
              ? 'text-primary'
              : 'text-text-3 hover:text-text-2'
        "
        :aria-label="tab.label"
        @click="handleTabClick(tab)"
      >
        <component
          :is="tab.icon"
          class="size-6 transition"
          :class="tab.action === 'quick-add' ? 'size-7' : ''"
          aria-hidden="true"
        />
        <span
          class="text-[10px] font-medium leading-tight"
          :class="tab.action === 'quick-add' ? 'font-semibold' : ''"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
