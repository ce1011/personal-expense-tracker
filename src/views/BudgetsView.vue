<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { CalendarDays, Info, Plus } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import UiNumberField from '@/components/ui/UiNumberField.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import TargetLimitEditor from '@/components/budgets/TargetLimitEditor.vue'
import { useAppData } from '@/composables/useAppData'
import { useBudgetsData } from '@/composables/useBudgetsData'
import { getCycleWindow } from '@/lib/budgetCycle'
import type { CycleDraft } from '@/types/app-data'

const appData = useAppData()
const { cycles, targetExpenses, activeExpenseCategories, currency, loading } = useBudgetsData()
const selectedCycleId = shallowRef('')
const form = reactive<CycleDraft>({
  cycle_code: '',
  income_day: 25,
  income: 0,
  saving_target: 0,
})

const selectedCycle = computed(() =>
  cycles.value.find((cycle) => cycle.cycle_id === selectedCycleId.value),
)
const cycleLimits = computed(() =>
  targetExpenses.value.filter((limit) => limit.cycle_id === selectedCycle.value?.cycle_id),
)
const selectedWindowLabel = computed(() =>
  form.cycle_code && /^\d{6}$/.test(form.cycle_code)
    ? getCycleWindow(form.cycle_code, form.income_day).label
    : '',
)

watch(
  cycles,
  (list) => {
    if (!selectedCycleId.value) {
      selectedCycleId.value = list[0]?.cycle_id ?? ''
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
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">規劃</p>
      <h1 class="mt-1 text-h1 font-bold text-text">預算週期</h1>
      <p class="mt-1 text-body-sm text-text-2">
        預算週期不是自然月，而是按入糧日切分。總覽頁的收入、支出、結餘與分類上限，都會用這個週期範圍來計算。
      </p>
    </header>

    <div v-if="loading" class="grid gap-4">
      <SkeletonCard :lines="3" />
      <SkeletonCard :lines="4" />
      <SkeletonCard :lines="5" />
    </div>

    <template v-else>
      <BaseCard>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CalendarDays class="size-5 text-primary" aria-hidden="true" />
            <h2 class="text-h3 font-semibold text-text">選擇週期</h2>
          </div>
          <BaseButton variant="ghost" aria-label="新增預算週期" @click="newCycle">
            <Plus class="size-4" aria-hidden="true" />
            新增
          </BaseButton>
        </div>

        <div v-if="cycles.length" class="mt-4 flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="cycle in cycles"
            :key="cycle.cycle_id"
            type="button"
            class="shrink-0 rounded-xl border px-4 py-2.5 text-left transition"
            :class="
              cycle.cycle_id === selectedCycleId
                ? 'border-primary bg-primary/5 text-text'
                : 'border-border bg-surface text-text-2 hover:border-primary/50'
            "
            @click="selectedCycleId = cycle.cycle_id"
          >
            <span class="block text-sm font-semibold">{{ cycle.cycle_code }}</span>
            <span class="block text-xs text-text-3">入糧日：每月 {{ cycle.income_day }} 號</span>
          </button>
        </div>
        <EmptyState
          v-else
          class="mt-4"
          :icon="CalendarDays"
          title="尚未有週期"
          message="先建立一個預算週期，總覽和分類預算才有計算基準。"
        >
          <template #action>
            <BaseButton class="mt-5 w-full" @click="newCycle">
              <Plus class="size-4" aria-hidden="true" />
              新增週期
            </BaseButton>
          </template>
        </EmptyState>
      </BaseCard>

      <BaseCard>
        <div class="flex items-center gap-2">
          <Info class="size-5 text-primary" aria-hidden="true" />
          <h2 class="text-h3 font-semibold text-text">週期設定</h2>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BaseInput
            v-model.trim="form.cycle_code"
            label="週期代碼"
            placeholder="202605"
            inputmode="numeric"
            autocomplete="off"
          />
          <UiNumberField
            v-model="form.income_day"
            label="入糧日"
            :min="1"
            :max="31"
            :step="1"
          />
          <UiNumberField v-model="form.income" label="固定收入" :min="0" :step="0.01" />
          <UiNumberField v-model="form.saving_target" label="儲蓄目標" :min="0" :step="0.01" />
        </div>

        <BaseCard variant="primary" class="mt-4">
          <div class="flex items-start gap-2 text-body-sm text-text-2">
            <Info class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p v-if="selectedWindowLabel">這個週期會涵蓋：{{ selectedWindowLabel }}</p>
              <p v-else>例如入糧日是 25 號，202605 代表 4 月 25 日到 5 月 24 日。</p>
            </div>
          </div>
        </BaseCard>

        <BaseButton class="mt-4 w-full sm:w-auto" @click="saveCycle">儲存週期</BaseButton>
      </BaseCard>

      <TargetLimitEditor
        :cycle="selectedCycle"
        :categories="activeExpenseCategories"
        :limits="cycleLimits"
        :currency="currency"
        @save-limit="appData.saveTargetLimit"
      />
    </template>
  </div>
</template>
