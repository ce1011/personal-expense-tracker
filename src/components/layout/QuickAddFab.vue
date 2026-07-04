<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  click: []
}>()

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-2 focus-visible:ring-offset-2"
    aria-label="快速新增交易"
    @click="handleClick"
  >
    <Plus class="size-6" aria-hidden="true" />
  </button>
</template>
