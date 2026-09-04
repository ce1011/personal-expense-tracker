<script setup lang="ts">
import { Label } from 'reka-ui'

defineProps<{
  for?: string
}>()
</script>

<template>
  <Label :for="for" class="mb-1.5 block text-sm font-medium text-text-2">
    <slot />
  </Label>
</template>
