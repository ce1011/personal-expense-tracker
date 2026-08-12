<script setup lang="ts">
import { computed } from 'vue'

import type { ShareSlice } from '@/lib/historyReview'

const props = defineProps<{
  slices: ShareSlice[]
  centerLabel: string
  centerValue: string
}>()

const radius = 36
const circumference = 2 * Math.PI * radius

const arcs = computed(() => {
  let offset = 0
  const visible = props.slices.filter((slice) => slice.percentage > 0).slice(0, 8)
  const total = visible.reduce((sum, slice) => sum + slice.percentage, 0) || 1

  return visible.map((slice) => {
    const portion = slice.percentage / total
    const length = portion * circumference
    const arc = {
      ...slice,
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    }
    offset += length
    return arc
  })
})
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-center">
    <svg viewBox="0 0 120 120" class="mx-auto size-44" role="img" :aria-label="centerLabel">
      <circle cx="60" cy="60" r="36" fill="none" stroke="var(--color-border)" stroke-width="16" />
      <circle
        v-for="arc in arcs"
        :key="arc.key"
        cx="60"
        cy="60"
        r="36"
        fill="none"
        :stroke="arc.color"
        stroke-width="16"
        stroke-linecap="butt"
        :stroke-dasharray="arc.dasharray"
        :stroke-dashoffset="arc.dashoffset"
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="56"
        text-anchor="middle"
        class="fill-text-2"
        style="font-size: 8px; font-weight: 600"
      >
        {{ centerLabel }}
      </text>
      <text
        x="60"
        y="70"
        text-anchor="middle"
        class="fill-text"
        style="font-size: 11px; font-weight: 700"
      >
        {{ centerValue }}
      </text>
    </svg>

    <ul class="grid gap-2">
      <li v-for="slice in slices.slice(0, 6)" :key="slice.key" class="flex items-center gap-3">
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: slice.color }" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-body-sm font-semibold text-text">{{ slice.label }}</p>
          <p v-if="slice.children?.length" class="truncate text-caption text-text-3">
            {{ slice.children[0]?.label }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-body-sm font-semibold text-text">{{ Math.round(slice.percentage) }}%</p>
        </div>
      </li>
    </ul>
  </div>
</template>
