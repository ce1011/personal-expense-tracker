<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChartPie, LayoutDashboard, ListChecks, PlusCircle, Settings2 } from 'lucide-vue-next'

import { useOverlayState } from '@/composables/useOverlayState'

const emit = defineEmits<{
  quickAdd: []
}>()

const route = useRoute()
const router = useRouter()
const { isOverlayOpen } = useOverlayState()

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
    class="bottom-tab safe-bottom fixed bottom-0 left-0 right-0 z-30 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
    :class="{ 'bottom-tab--hidden': isOverlayOpen }"
    :aria-hidden="isOverlayOpen"
    :inert="isOverlayOpen"
    aria-label="主要導航"
  >
    <div class="mx-auto flex max-w-md items-end justify-around">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        type="button"
        class="tab-item group flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
        :class="
          tab.action === 'quick-add'
            ? 'tab-item--quick relative -top-3 mb-1 rounded-full bg-primary px-3 text-white'
            : isActive(tab.name)
              ? 'tab-item--active text-primary'
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
          v-if="isActive(tab.name) && tab.action !== 'quick-add'"
          class="tab-item__dot"
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

<style scoped>
.bottom-tab {
  border-top: 1px solid rgb(233 221 255 / 78%);
  background: color-mix(in srgb, white 88%, transparent);
  box-shadow: 0 -12px 40px rgb(67 40 119 / 9%);
  backdrop-filter: blur(22px) saturate(140%);
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s linear;
}

.bottom-tab--hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(100% + env(safe-area-inset-bottom)));
  transition:
    opacity 160ms ease,
    transform 240ms ease,
    visibility 0s linear 240ms;
}

.tab-item {
  position: relative;
  border-radius: 0.9rem;
  transition:
    color 180ms ease,
    background-color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-item:not(.tab-item--quick):active {
  transform: scale(0.92);
}

.tab-item--active {
  background: linear-gradient(180deg, rgb(124 58 237 / 8%), transparent);
}

.tab-item--active :deep(svg) {
  animation: tab-arrive 380ms cubic-bezier(0.16, 1, 0.3, 1);
  filter: drop-shadow(0 4px 8px rgb(124 58 237 / 18%));
}

.tab-item--quick {
  box-shadow:
    0 12px 26px rgb(91 33 182 / 28%),
    inset 0 1px 0 rgb(255 255 255 / 28%);
  transition:
    background-color 180ms ease,
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 200ms ease;
}

.tab-item--quick:hover {
  background: var(--color-primary-2);
  box-shadow: 0 16px 32px rgb(91 33 182 / 34%);
  transform: translateY(-2px);
}

.tab-item--quick:active {
  transform: scale(0.92);
}

.tab-item__dot {
  position: absolute;
  bottom: 0;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--color-primary);
  animation: dot-arrive 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tab-arrive {
  0% {
    transform: translateY(4px) scale(0.76) rotate(-8deg);
  }
  70% {
    transform: translateY(-1px) scale(1.06);
  }
}

@keyframes dot-arrive {
  from {
    opacity: 0;
    transform: scale(0);
  }
}
</style>
