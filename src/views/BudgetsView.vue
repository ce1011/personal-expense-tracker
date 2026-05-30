<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'

import TargetLimitEditor from '@/components/budgets/TargetLimitEditor.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAppData } from '@/composables/useAppData'
import type { CycleDraft } from '@/types/app-data'

const appData = useAppData()
const selectedCycleId = shallowRef('')
const form = reactive<CycleDraft>({
  cycle_code: '',
  income_day: 25,
  income: 0,
  saving_target: 0,
})

const selectedCycle = computed(() =>
  appData.data.value.cycles.find((cycle) => cycle.cycle_id === selectedCycleId.value),
)
const cycleLimits = computed(() =>
  appData.data.value.targetExpenses.filter((limit) => limit.cycle_id === selectedCycle.value?.cycle_id),
)

watch(
  () => appData.data.value.cycles,
  (cycles) => {
    if (!selectedCycleId.value) {
      selectedCycleId.value = cycles[0]?.cycle_id ?? ''
    }
  },
  { immediate: true },
)

watch(
  selectedCycle,
  (cycle) => {
    form.cycle_code = cycle?.cycle_code ?? ''
    form.income_day = cycle?.income_day ?? 25
    form.income = cycle?.income ?? 0
    form.saving_target = cycle?.saving_target ?? 0
  },
  { immediate: true },
)

function newCycle(): void {
  selectedCycleId.value = ''
  form.cycle_code = ''
  form.income_day = 25
  form.income = 0
  form.saving_target = 0
}

function saveCycle(): void {
  if (!/^\d{6}$/.test(form.cycle_code)) {
    return
  }

  void appData.saveCycle({ ...form }, selectedCycle.value?.cycle_id)
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Planning</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">Budgets</h1>
    </section>

    <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-stone-950">Cycles</h2>
          <button type="button" class="text-sm font-semibold text-emerald-800" @click="newCycle">New</button>
        </div>
        <div v-if="appData.data.value.cycles.length" class="mt-4 grid gap-2">
          <button
            v-for="cycle in appData.data.value.cycles"
            :key="cycle.cycle_id"
            type="button"
            class="rounded-md border px-3 py-2 text-left text-sm"
            :class="cycle.cycle_id === selectedCycleId ? 'border-emerald-700 bg-emerald-50' : 'border-stone-200'"
            @click="selectedCycleId = cycle.cycle_id"
          >
            <span class="font-semibold">{{ cycle.cycle_code }}</span>
            <span class="block text-xs text-stone-500">Income day {{ cycle.income_day }}</span>
          </button>
        </div>
        <EmptyState v-else class="mt-4" title="No cycles" message="Create a cycle to start budgeting." />
      </section>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 class="text-lg font-semibold text-stone-950">Cycle details</h2>
        <div class="mt-4 grid gap-3 md:grid-cols-4">
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            Cycle code
            <input v-model.trim="form.cycle_code" placeholder="202605" class="rounded-md border border-stone-300 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            Income day
            <input v-model.number="form.income_day" min="1" max="31" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            Income
            <input v-model.number="form.income" min="0" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            Saving target
            <input v-model.number="form.saving_target" min="0" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
          </label>
        </div>
        <button type="button" class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" @click="saveCycle">
          Save cycle
        </button>
      </section>
    </div>

    <TargetLimitEditor
      :cycle="selectedCycle"
      :categories="appData.activeExpenseCategories.value"
      :limits="cycleLimits"
      :currency="appData.currency.value"
      @save-limit="appData.saveTargetLimit"
    />
  </div>
</template>
