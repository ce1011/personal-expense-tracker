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
      class="animate-pulse flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"
    >
      <div class="size-10 shrink-0 rounded-full bg-text-3/20" />
      <div class="min-w-0 flex-1">
        <div class="h-4 w-2/5 rounded bg-text-3/20" />
        <div class="mt-2 h-3 w-1/3 rounded bg-text-3/20" />
      </div>
      <div class="h-5 w-16 shrink-0 rounded bg-text-3/20" />
    </div>
  </div>
</template>
