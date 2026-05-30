<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <div class="rounded-md border border-dashed border-stone-300 bg-white/70 p-6 text-center">
    <p class="text-sm font-semibold text-stone-900">{{ title }}</p>
    <p class="mt-1 text-sm text-stone-500">{{ message }}</p>
  </div>
</template>
