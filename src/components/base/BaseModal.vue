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
      class="fixed inset-0 z-40 grid place-items-center bg-text/40 px-4 py-8 backdrop-blur-sm"
      @click="handleBackdropClick"
    >
      <div
        class="w-full rounded-2xl bg-surface p-4 shadow-xl"
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
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
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
