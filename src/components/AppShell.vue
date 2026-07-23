<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import QuickAddFab from '@/components/layout/QuickAddFab.vue'
import type { BudgetCycle } from '@/types/app-data'

defineProps<{
  currentCycle?: BudgetCycle
  loading: boolean
}>()

const emit = defineEmits<{
  quickAdd: []
}>()

function handleQuickAdd(): void {
  emit('quickAdd')
}
</script>

<template>
  <div class="app-shell safe-top safe-bottom flex min-h-screen flex-col bg-bg text-text">
    <div class="app-shell__atmosphere" aria-hidden="true">
      <span class="app-shell__orb app-shell__orb--one" />
      <span class="app-shell__orb app-shell__orb--two" />
    </div>
    <AppHeader :current-cycle="currentCycle" :loading="loading" />

    <main
      class="relative z-10 flex-1 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8"
    >
      <div class="mx-auto max-w-6xl">
        <slot />
      </div>
    </main>

    <QuickAddFab @click="handleQuickAdd" />
    <BottomTabBar @quick-add="handleQuickAdd" />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
}

.app-shell__atmosphere {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-shell__orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(4px);
  opacity: 0.42;
  will-change: transform;
}

.app-shell__orb--one {
  top: 8%;
  right: -9rem;
  width: 22rem;
  height: 22rem;
  background: radial-gradient(circle, rgb(167 139 250 / 22%), transparent 68%);
  animation: orbit-drift-one 18s ease-in-out infinite alternate;
}

.app-shell__orb--two {
  bottom: 8%;
  left: -10rem;
  width: 25rem;
  height: 25rem;
  background: radial-gradient(circle, rgb(45 212 191 / 14%), transparent 68%);
  animation: orbit-drift-two 22s ease-in-out infinite alternate;
}

@keyframes orbit-drift-one {
  to {
    transform: translate3d(-4rem, 5rem, 0) scale(1.08);
  }
}

@keyframes orbit-drift-two {
  to {
    transform: translate3d(5rem, -4rem, 0) scale(0.92);
  }
}
</style>
