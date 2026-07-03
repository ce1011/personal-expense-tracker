<script setup lang="ts">
import { CalendarClock, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { UpcomingBill } from '@/lib/dailyFinance/recurringExpenses'

const props = defineProps<{
  fixedTotal: number
  upcomingBills: readonly UpcomingBill[]
  currency: string
}>()

const router = useRouter()

function goToFixedExpenses(): void {
  void router.push('/fixed-expenses')
}

const visibleBills = computed(() => props.upcomingBills.slice(0, 2))
</script>

<template>
  <BaseCard>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-text">固定支出</h2>
        <p class="mt-1 text-sm text-text-2">本期預估固定支出總額</p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <p class="text-right text-xl font-bold text-text">
          {{ formatCurrency(fixedTotal, currency) }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text transition hover:bg-accent"
          @click="goToFixedExpenses"
        >
          管理
          <ChevronRight class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="visibleBills.length" class="mt-4 space-y-2">
      <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-text-3">即將到期</h3>
      <div
        v-for="bill in visibleBills"
        :key="bill.transaction_id"
        class="flex items-center justify-between gap-3 rounded-xl bg-accent px-3 py-2"
      >
        <div class="flex items-center gap-2 text-sm text-text">
          <CalendarClock class="size-4 text-text-3" aria-hidden="true" />
          {{ bill.name }}
        </div>
        <div class="text-right text-sm">
          <p class="font-medium text-text">{{ formatCurrency(bill.amount, currency) }}</p>
          <p class="text-xs text-text-2">
            {{ formatDate(bill.dueTimestamp) }} · 還有 {{ bill.daysUntilDue }} 天
          </p>
        </div>
      </div>
    </div>
    <EmptyState
      v-else
      class="mt-4"
      :icon="CalendarClock"
      title="沒有即將到期的固定支出"
      message="未來 14 天內沒有即將到期的固定支出。"
    />
  </BaseCard>
</template>
