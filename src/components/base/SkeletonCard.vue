<script setup lang="ts">
withDefaults(
  defineProps<{
    lines?: number
  }>(),
  {
    lines: 3,
  },
)
</script>

<template>
  <div class="animate-pulse rounded-2xl bg-surface p-4 shadow-sm">
    <div class="h-4 w-1/3 rounded bg-text-3/20" />
    <div class="mt-3 h-8 w-1/2 rounded bg-text-3/20" />
    <div
      v-for="index in Math.max(0, lines - 2)"
      :key="index"
      class="mt-2 h-4 rounded bg-text-3/20"
      :class="index % 2 === 1 ? 'w-2/3' : 'w-1/2'"
    />
  </div>
</template>
