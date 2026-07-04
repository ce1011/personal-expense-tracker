<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import { formatCurrency } from '@/lib/formatters'
import type { OverspendForecast } from '@/lib/dailyFinance/overspendForecast'

defineProps<{
  forecast?: OverspendForecast
  currency: string
}>()
</script>

<template>
  <BaseCard v-if="forecast" :variant="forecast.isProjectedToOverspend ? 'danger' : 'primary'">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-2">月尾預警</p>
        <h2 class="mt-1 text-base font-semibold text-text">
          {{ forecast.isProjectedToOverspend ? '照目前速度可能會超支' : '目前支出速度仍然安全' }}
        </h2>
        <p class="mt-2 text-sm text-text-2">
          已過 {{ forecast.elapsedDays }} 日，按現時節奏推算，尚餘 {{ forecast.remainingDays }} 日。
        </p>
      </div>
      <p class="text-right text-xl font-bold text-text">
        {{
          formatCurrency(
            forecast.isProjectedToOverspend
              ? forecast.projectedOverspendAmount
              : forecast.projectedSurplusAmount,
            currency,
          )
        }}
      </p>
    </div>
  </BaseCard>
</template>
