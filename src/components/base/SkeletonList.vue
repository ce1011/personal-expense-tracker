<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
  }>(),
  {
    rows: 4,
  },
)
</script>

<template>
  <div class="grid gap-3">
    <div
      v-for="index in rows"
      :key="index"
      class="skeleton-shell animate-pulse flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"
    >
      <div class="skeleton-block size-10 shrink-0 rounded-full" />
      <div class="min-w-0 flex-1">
        <div class="skeleton-block h-4 w-2/5 rounded" />
        <div class="skeleton-block mt-2 h-3 w-1/3 rounded" />
      </div>
      <div class="skeleton-block h-5 w-16 shrink-0 rounded" />
    </div>
  </div>
</template>
