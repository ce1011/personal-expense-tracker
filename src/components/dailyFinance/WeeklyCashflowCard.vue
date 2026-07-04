<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

defineProps<{
  brief: readonly string[]
}>()
</script>

<template>
  <BaseCard>
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">每週簡報</p>
    <h2 class="mt-1 text-base font-semibold text-text">現金流 insight</h2>
    <ul v-if="brief.length" class="mt-4 space-y-2 text-sm text-text-2">
      <li v-for="line in brief" :key="line">{{ line }}</li>
    </ul>
    <p v-else class="mt-4 text-sm text-text-3">暫時未有足夠資料產生本週簡報。</p>
  </BaseCard>
</template>
