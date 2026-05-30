<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'

import TargetLimitEditor from '@/components/budgets/TargetLimitEditor.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAppData } from '@/composables/useAppData'
import { getCycleWindow } from '@/lib/budgetCycle'
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
const selectedWindowLabel = computed(() =>
  form.cycle_code && /^\d{6}$/.test(form.cycle_code)
    ? getCycleWindow(form.cycle_code, form.income_day).label
    : '',
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
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">規劃</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">預算週期</h1>
      <p class="mt-2 max-w-3xl text-sm text-stone-600">
        預算週期不是自然月，而是按入糧日切分。總覽頁的收入、支出、結餘與分類上限，都會用這個週期範圍來計算。
      </p>
    </section>

    <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-stone-950">週期清單</h2>
          <button type="button" class="text-sm font-semibold text-emerald-800" @click="newCycle">新增</button>
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
            <span class="block text-xs text-stone-500">入糧日：每月 {{ cycle.income_day }} 號</span>
          </button>
        </div>
        <EmptyState v-else class="mt-4" title="尚未有週期" message="先建立一個預算週期，總覽和分類預算才有計算基準。" />
      </section>

      <div class="grid gap-6">
        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 class="text-lg font-semibold text-stone-950">週期設定</h2>
          <div class="mt-4 grid gap-3 md:grid-cols-4">
            <label class="grid gap-1 text-sm font-medium text-stone-700">
              週期代碼
              <input v-model.trim="form.cycle_code" placeholder="202605" class="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm font-medium text-stone-700">
              入糧日
              <input v-model.number="form.income_day" min="1" max="31" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm font-medium text-stone-700">
              固定收入
              <input v-model.number="form.income" min="0" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm font-medium text-stone-700">
              儲蓄目標
              <input v-model.number="form.saving_target" min="0" type="number" class="rounded-md border border-stone-300 px-3 py-2" />
            </label>
          </div>
          <div class="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
            <p v-if="selectedWindowLabel">這個週期會涵蓋：{{ selectedWindowLabel }}</p>
            <p class="mt-1 text-xs text-stone-500">例如入糧日是 25 號，`202605` 代表 4 月 25 日到 5 月 24 日。</p>
          </div>
          <button type="button" class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" @click="saveCycle">
            儲存週期
          </button>
        </section>

        <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 class="text-lg font-semibold text-stone-950">怎樣使用預算週期</h2>
          <div class="mt-4 grid gap-3 text-sm text-stone-600">
            <p>1. 先設定入糧日，系統就知道每個週期從哪一天開始。</p>
            <p>2. 再填入這個週期的固定收入和儲蓄目標。</p>
            <p>3. 到下方為各支出分類設定上限，例如午餐、交通、娛樂。</p>
            <p>4. 每次記帳後，總覽頁就會按這個週期自動更新支出、收入和剩餘預算。</p>
          </div>
        </section>
      </div>
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
