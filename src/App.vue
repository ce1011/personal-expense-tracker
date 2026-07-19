<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppShell from '@/components/AppShell.vue'
import QuickAddSheet from '@/components/transactions/QuickAddSheet.vue'
import { useAppData } from '@/composables/useAppData'
import { useShellData } from '@/composables/useShellData'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const route = useRoute()
const isQuickAddOpen = shallowRef(false)

// Shell chrome (header cycle label + trip-mode switch). Skipped on public
// (auth) routes, which render bare without the shell.
const isPublic = computed(() => Boolean(route.meta.public))
const { currentCycle, loading } = useShellData(isPublic)

onMounted(() => {
  void appData.refresh()
})

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
  <RouterView v-if="route.meta.public" />

  <template v-else>
    <AppShell :current-cycle="currentCycle" :loading="loading" @quick-add="openQuickAdd">
      <RouterView />
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
