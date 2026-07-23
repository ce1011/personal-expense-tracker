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
    <div v-if="label" class="mb-1 text-xs text-text-2">{{ label }}</div>
    <div
      class="progress-track w-full overflow-hidden rounded-full"
      :class="size === 'md' ? 'h-3' : 'h-2'"
      role="progressbar"
      :aria-valuenow="Math.min(percentage, 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="progress-fill h-full rounded-full"
        :class="colorClass"
        :style="{ width: `${Math.min(percentage, 100)}%`, backgroundColor: colorStyle }"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-track {
  background: color-mix(in srgb, var(--color-primary) 8%, white);
  box-shadow: inset 0 1px 2px rgb(34 22 58 / 8%);
}

.progress-fill {
  position: relative;
  overflow: hidden;
  transition: width 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-fill::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 42%), transparent);
  content: '';
  transform: translateX(-100%);
  animation: progress-glint 2.4s ease-in-out infinite;
}

@keyframes progress-glint {
  45%,
  100% {
    transform: translateX(150%);
  }
}
</style>
