<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { RouterView } from 'vue-router'

import AppShell from '@/components/AppShell.vue'
import QuickAddSheet from '@/components/transactions/QuickAddSheet.vue'
import { useAppData } from '@/composables/useAppData'
import type { ExpenseDraft, IncomeDraft, SavingDraft } from '@/types/app-data'

const appData = useAppData()
const isQuickAddOpen = shallowRef(false)

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
  <AppShell
    :current-cycle="appData.currentCycle.value"
    :loading="appData.loading.value"
    @quick-add="openQuickAdd"
  >
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
