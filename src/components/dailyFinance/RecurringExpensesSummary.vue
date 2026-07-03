<script setup lang="ts">
import { CalendarClock, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { UpcomingBill } from '@/lib/dailyFinance/recurringExpenses'

defineProps<{
  fixedTotal: number
  upcomingBills: readonly UpcomingBill[]
  currency: string
}>()

const router = useRouter()

function goToFixedExpenses(): void {
  void router.push('/fixed-expenses')
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">固定支出</h2>
        <p class="mt-1 text-sm text-stone-500">本期預估固定支出總額</p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <p class="text-right text-lg font-semibold text-stone-950">
          {{ formatCurrency(fixedTotal, currency) }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          @click="goToFixedExpenses"
        >
          管理
          <ChevronRight class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="upcomingBills.length" class="mt-4 space-y-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-stone-500">即將到期</h3>
      <div
        v-for="bill in upcomingBills"
        :key="bill.transaction_id"
        class="flex items-center justify-between gap-3 rounded-md border border-stone-100 bg-stone-50 px-3 py-2"
      >
        <div class="flex items-center gap-2 text-sm text-stone-700">
          <CalendarClock class="size-4 text-stone-400" aria-hidden="true" />
          {{ bill.name }}
        </div>
        <div class="text-right text-sm">
          <p class="font-medium text-stone-900">{{ formatCurrency(bill.amount, currency) }}</p>
          <p class="text-xs text-stone-500">
            {{ formatDate(bill.dueTimestamp) }} · 還有 {{ bill.daysUntilDue }} 天
          </p>
        </div>
      </div>
    </div>
    <EmptyState
      v-else
      class="mt-4"
      title="沒有即將到期的固定支出"
      message="未來 14 天內沒有即將到期的固定支出。"
    />
  </article>
</template>
