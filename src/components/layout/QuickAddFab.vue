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
    class="quick-add-fab fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 hidden size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg focus-visible:ring-offset-2 md:inline-flex"
    aria-label="快速新增交易"
    @click="handleClick"
  >
    <Plus class="size-6" aria-hidden="true" />
  </button>
</template>

<style scoped>
.quick-add-fab {
  box-shadow:
    0 16px 36px rgb(91 33 182 / 30%),
    inset 0 1px 0 rgb(255 255 255 / 28%);
  transition:
    background-color 180ms ease,
    box-shadow 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-add-fab::before {
  position: absolute;
  inset: -6px;
  border: 1px solid rgb(124 58 237 / 20%);
  border-radius: inherit;
  content: '';
  animation: fab-breathe 2.8s ease-in-out infinite;
}

.quick-add-fab:hover {
  background: var(--color-primary-2);
  box-shadow: 0 20px 42px rgb(91 33 182 / 38%);
  transform: translateY(-3px) rotate(3deg);
}

.quick-add-fab:active {
  transform: translateY(0) scale(0.94);
}

@keyframes fab-breathe {
  50% {
    opacity: 0;
    transform: scale(1.16);
  }
}
</style>
