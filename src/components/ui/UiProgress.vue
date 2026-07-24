<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percentage: number
    colorClass?: string
    colorStyle?: string
    size?: 'sm' | 'md'
    label?: string
  }>(),
  {
    size: 'sm',
  },
)

const clamped = computed(() => Math.min(Math.max(props.percentage, 0), 100))
</script>

<template>
  <div class="w-full">
    <div v-if="label" class="mb-1 text-xs text-text-2">{{ label }}</div>
    <ProgressRoot
      :model-value="clamped"
      :max="100"
      class="progress-track w-full overflow-hidden rounded-full"
      :class="size === 'md' ? 'h-3' : 'h-2'"
    >
      <ProgressIndicator
        class="progress-fill h-full rounded-full transition-[width,transform] duration-700 ease-out"
        :class="colorClass"
        :style="{
          width: `${clamped}%`,
          backgroundColor: colorStyle,
          transform: 'translateZ(0)',
        }"
      />
    </ProgressRoot>
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
