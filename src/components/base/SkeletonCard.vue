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
  <div class="skeleton-shell animate-pulse rounded-2xl bg-surface p-4 shadow-sm">
    <div class="skeleton-block h-4 w-1/3 rounded" />
    <div class="skeleton-block mt-3 h-8 w-1/2 rounded" />
    <div
      v-for="index in Math.max(0, lines - 2)"
      :key="index"
      class="skeleton-block mt-2 h-4 rounded"
      :class="index % 2 === 1 ? 'w-2/3' : 'w-1/2'"
    />
  </div>
</template>
