<script setup lang="ts">
defineProps<{
  percentage: number
  colorClass?: string
  colorStyle?: string
  size?: 'sm' | 'md'
  label?: string
}>()
</script>

<template>
  <div class="w-full">
    <div v-if="label" class="mb-1 text-xs text-stone-500">{{ label }}</div>
    <div
      class="w-full overflow-hidden rounded-full bg-stone-100"
      :class="size === 'md' ? 'h-3' : 'h-2'"
      role="progressbar"
      :aria-valuenow="Math.min(percentage, 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full rounded-full transition-all"
        :class="colorClass"
        :style="{ width: `${Math.min(percentage, 100)}%`, backgroundColor: colorStyle }"
      />
    </div>
  </div>
</template>
