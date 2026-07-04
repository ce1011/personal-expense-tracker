<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

defineProps<{
  alerts: readonly { transactionId: string; message: string }[]
}>()
</script>

<template>
  <BaseCard>
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">異常開支</p>
    <h2 class="mt-1 text-base font-semibold text-text">近期偏貴提醒</h2>
    <ul v-if="alerts.length" class="mt-4 space-y-2 text-sm text-text-2">
      <li
        v-for="alert in alerts.slice(0, 3)"
        :key="alert.transactionId"
        class="rounded-xl bg-accent px-3 py-2"
      >
        {{ alert.message }}
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-text-3">最近未見明顯偏高的同類開支。</p>
  </BaseCard>
</template>
