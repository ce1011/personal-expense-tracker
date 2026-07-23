<script setup lang="ts">
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    show: boolean
    title?: string
    subtitle?: string
    maxWidth?: string
  }>(),
  {
    maxWidth: 'max-w-md',
  },
)

const emit = defineEmits<{
  close: []
}>()

function handleBackdropClick(): void {
  emit('close')
}

function handleCloseClick(): void {
  emit('close')
}

function handlePanelClick(event: MouseEvent): void {
  event.stopPropagation()
}
</script>

<template>
  <Transition name="modal-pop">
    <div
      v-if="show"
      class="modal-backdrop fixed inset-0 z-40 grid place-items-center bg-text/40 px-4 py-8 backdrop-blur-sm"
      @click="handleBackdropClick"
    >
      <div
        class="modal-panel w-full rounded-2xl bg-surface p-4 shadow-xl"
        :class="maxWidth"
        @click="handlePanelClick"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 v-if="title" class="text-xl font-semibold text-text">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-sm text-text-2">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="modal-close inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            aria-label="關閉"
            @click="handleCloseClick"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>

        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  transition:
    opacity 220ms ease,
    backdrop-filter 260ms ease;
}

.modal-panel {
  box-shadow:
    0 30px 80px rgb(34 22 58 / 24%),
    inset 0 1px 0 rgb(255 255 255 / 85%);
  transition:
    opacity 180ms ease,
    transform 360ms cubic-bezier(0.22, 1.35, 0.36, 1);
  transform-origin: 50% 62%;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

.modal-pop-enter-from .modal-panel,
.modal-pop-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(18px) scale(0.94);
}

.modal-pop-leave-active,
.modal-pop-leave-active .modal-panel {
  transition-duration: 170ms;
  transition-timing-function: ease-in;
}

.modal-close:hover {
  transform: rotate(8deg) scale(1.05);
}

.modal-close:active {
  transform: scale(0.9);
}
</style>
