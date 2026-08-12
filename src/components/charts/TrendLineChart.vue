<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  points: Array<{ label: string; value: number }>
  color?: string
  fill?: boolean
  formatValue: (value: number) => string
}>()

const width = 320
const height = 148
const padding = { top: 16, right: 12, bottom: 28, left: 12 }

const geometry = computed(() => {
  const values = props.points.map((point) => point.value)
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const step = props.points.length > 1 ? innerWidth / (props.points.length - 1) : innerWidth
  const mapped = props.points.map((point, index) => {
    const x = padding.left + index * step
    const y = padding.top + ((max - point.value) / span) * innerHeight
    return { ...point, x, y }
  })
  const zeroY = padding.top + (max / span) * innerHeight
  const line = mapped.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
  const area = mapped.length
    ? `${line} L${mapped[mapped.length - 1]?.x} ${zeroY} L${mapped[0]?.x} ${zeroY} Z`
    : ''

  return { mapped, line, area, zeroY }
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="h-40 w-full"
    role="img"
    :aria-label="points.length ? `最新 ${formatValue(points[points.length - 1]?.value ?? 0)}` : '趨勢圖'"
  >
    <line
      :x1="padding.left"
      :x2="width - padding.right"
      :y1="geometry.zeroY"
      :y2="geometry.zeroY"
      stroke="var(--color-border)"
      stroke-dasharray="4 4"
    />
    <path
      v-if="fill && geometry.area"
      :d="geometry.area"
      :fill="color ?? 'var(--color-primary)'"
      fill-opacity="0.12"
    />
    <path
      :d="geometry.line"
      fill="none"
      :stroke="color ?? 'var(--color-primary)'"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g v-for="point in geometry.mapped" :key="point.label">
      <circle :cx="point.x" :cy="point.y" r="3.2" :fill="color ?? 'var(--color-primary)'" />
      <text
        :x="point.x"
        :y="height - 8"
        text-anchor="middle"
        class="fill-text-3"
        style="font-size: 9px"
      >
        {{ point.label }}
      </text>
    </g>
  </svg>
</template>
