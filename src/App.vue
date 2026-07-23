<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppShell from '@/components/AppShell.vue'
import QuickAddSheet from '@/components/transactions/QuickAddSheet.vue'
import { initializeAppContext, useAppData } from '@/composables/useAppData'
import { useShellData } from '@/composables/useShellData'
import { useAuthStore } from '@/stores/auth'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const auth = useAuthStore()
const route = useRoute()
const isQuickAddOpen = shallowRef(false)

// Shell chrome (header cycle label + trip-mode switch). Skipped on public
// (auth) routes, which render bare without the shell.
const isPublic = computed(() => Boolean(route.meta.public))
const { currentCycle, loading } = useShellData(isPublic)

// Initialize shared context only after auth restoration/login has completed.
// The watcher also handles login/register without coupling the auth view to app data.
watch(
  () => [auth.ready, auth.isAuthenticated] as const,
  ([ready, authenticated]) => {
    if (ready && authenticated) {
      void initializeAppContext()
    }
  },
  { immediate: true },
)

function openQuickAdd(): void {
  isQuickAddOpen.value = true
}

function closeQuickAdd(): void {
  isQuickAddOpen.value = false
}

async function addExpense(draft: ExpenseDraft): Promise<void> {
  await appData.addExpense(draft)
  closeQuickAdd()
}

async function addIncome(draft: IncomeDraft): Promise<void> {
  await appData.addIncome(draft)
  closeQuickAdd()
}

async function addSaving(draft: SavingDraft): Promise<void> {
  await appData.addSaving(draft)
  closeQuickAdd()
}
</script>

<template>
  <!-- Auth pages render bare (no app chrome / quick-add). -->
  <RouterView v-if="route.meta.public" v-slot="{ Component, route: activeRoute }">
    <Transition name="auth-page" mode="out-in">
      <component :is="Component" :key="activeRoute.fullPath" />
    </Transition>
  </RouterView>

  <template v-else>
    <AppShell :current-cycle="currentCycle" :loading="loading" @quick-add="openQuickAdd">
      <RouterView v-slot="{ Component, route: activeRoute }">
        <Transition name="page-shift" mode="out-in">
          <component :is="Component" :key="activeRoute.name ?? activeRoute.path" />
        </Transition>
      </RouterView>
    </AppShell>

    <QuickAddSheet
      v-model="isQuickAddOpen"
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
  </template>
</template>
