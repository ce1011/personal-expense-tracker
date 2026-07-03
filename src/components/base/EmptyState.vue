<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  message: string
}>()
</script>

<template>
  <div class="flex flex-col items-center rounded-2xl bg-surface p-8 text-center">
    <component :is="icon" class="size-12 text-text-3" aria-hidden="true" />
    <p class="mt-4 text-base font-semibold text-text">{{ title }}</p>
    <p class="mt-1 text-sm text-text-2">{{ message }}</p>
    <div v-if="$slots.action" class="mt-5 w-full">
      <slot name="action" />
    </div>
  </div>
</template>
