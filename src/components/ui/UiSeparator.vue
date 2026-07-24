<script setup lang="ts">
import { Separator } from 'reka-ui'

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
  }>(),
  {
    orientation: 'horizontal',
  },
)
</script>

<template>
  <Separator
    :orientation="orientation"
    class="shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
  />
</template>
