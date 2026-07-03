<script setup lang="ts">
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    show: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    show: false,
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
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-40 bg-text/40 px-0 backdrop-blur-sm sm:px-4"
      @click="handleBackdropClick"
    >
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-full"
        enter-to-class="translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-full"
      >
        <div
          v-if="show"
          class="absolute bottom-0 left-0 right-0 flex h-[90vh] flex-col rounded-t-2xl bg-surface shadow-xl sm:relative sm:mx-auto sm:mt-auto sm:max-w-lg sm:rounded-2xl sm:h-auto sm:max-h-[85vh]"
          @click="handlePanelClick"
        >
          <div class="flex shrink-0 items-center justify-center pt-3 pb-2">
            <div class="h-1.5 w-12 rounded-full bg-border" />
          </div>

          <div class="flex items-start justify-between gap-4 border-b border-border px-4 pb-3">
            <div class="min-w-0">
              <h2 v-if="title" class="text-lg font-semibold text-text">{{ title }}</h2>
              <p v-if="subtitle" class="mt-0.5 text-sm text-text-2">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
              aria-label="關閉"
              @click="handleCloseClick"
            >
              <X class="size-5" aria-hidden="true" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <slot />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
