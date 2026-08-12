<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  points: Array<{ label: string; value: number }>
  color?: string
  fill?: boolean
  formatValue: (value: number) => string
}>()

const width = 320
const height = 168
const padding = { top: 12, right: 10, bottom: 28, left: 44 }

const geometry = computed(() => {
  const values = props.points.map((point) => point.value)
  const rawMax = Math.max(0, ...values)
  const rawMin = Math.min(0, ...values)
  const ticks = niceTicks(rawMin, rawMax)
  const max = Math.max(rawMax, ...ticks)
  const min = Math.min(rawMin, ...ticks)
  const span = max - min || 1
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const step = props.points.length > 1 ? innerWidth / (props.points.length - 1) : innerWidth
  const mapped = props.points.map((point, index) => {
    const x = padding.left + index * step
    const y = padding.top + ((max - point.value) / span) * innerHeight
    return { ...point, x, y }
  })
  const yTicks = ticks.map((value) => ({
    value,
    label: compactAxisLabel(value),
    y: padding.top + ((max - value) / span) * innerHeight,
  }))
  const zeroY = padding.top + (max / span) * innerHeight
  const line = mapped.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
  const area = mapped.length
    ? `${line} L${mapped[mapped.length - 1]?.x} ${zeroY} L${mapped[0]?.x} ${zeroY} Z`
    : ''

  return { mapped, line, area, zeroY, yTicks }
})

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    return [min]
  }

  const rough = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(rough) || 1))
  const residual = rough / magnitude
  const step =
    residual >= 7.5 ? 10 * magnitude : residual >= 3.5 ? 5 * magnitude : residual >= 1.5 ? 2 * magnitude : magnitude
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks: number[] = []

  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Number(value.toFixed(8)))
  }

  return ticks
}

function compactAxisLabel(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 10_000) {
    const wan = abs / 10_000
    const text = wan >= 10 || Number.isInteger(wan) ? String(Math.round(wan)) : wan.toFixed(1).replace(/\.0$/, '')
    return `${sign}${text}萬`
  }

  if (abs >= 1000) {
    const k = abs / 1000
    const text = k >= 10 || Number.isInteger(k) ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, '')
    return `${sign}${text}k`
  }

  return `${sign}${Math.round(abs)}`
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="h-44 w-full"
    role="img"
    :aria-label="points.length ? `最新 ${formatValue(points[points.length - 1]?.value ?? 0)}` : '趨勢圖'"
  >
    <g v-for="tick in geometry.yTicks" :key="tick.value">
      <line
        :x1="padding.left"
        :x2="width - padding.right"
        :y1="tick.y"
        :y2="tick.y"
        stroke="var(--color-border)"
        :stroke-dasharray="tick.value === 0 ? '0' : '3 3'"
        :stroke-opacity="tick.value === 0 ? 1 : 0.7"
      />
      <text
        :x="padding.left - 6"
        :y="tick.y"
        text-anchor="end"
        dominant-baseline="middle"
        class="fill-text-3"
        style="font-size: 9px"
      >
        {{ tick.label }}
      </text>
    </g>
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
      <circle :cx="point.x" :cy="point.y" r="3.2" :fill="color ?? 'var(--color-primary)'">
        <title>{{ point.label }} · {{ formatValue(point.value) }}</title>
      </circle>
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
