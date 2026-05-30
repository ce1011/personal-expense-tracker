<script setup lang="ts">
defineProps<{
  label: string
  value: string
  detail?: string
  tone?: 'neutral' | 'good' | 'warn'
}>()
</script>

<template>
  <section
    class="rounded-md border bg-white p-4 shadow-sm"
    :class="{
      'border-stone-200': !tone || tone === 'neutral',
      'border-emerald-200': tone === 'good',
      'border-amber-200': tone === 'warn',
    }"
  >
    <p class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{{ label }}</p>
    <p class="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{{ value }}</p>
    <p v-if="detail" class="mt-1 text-sm text-stone-500">{{ detail }}</p>
  </section>
</template>
