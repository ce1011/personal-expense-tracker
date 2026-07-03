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
  <div class="flex min-h-screen flex-col bg-bg text-text">
    <AppHeader :current-cycle="currentCycle" :loading="loading" />

    <main class="flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <slot />
      </div>
    </main>

    <QuickAddFab @click="handleQuickAdd" />
    <BottomTabBar @quick-add="handleQuickAdd" />
  </div>
</template>
