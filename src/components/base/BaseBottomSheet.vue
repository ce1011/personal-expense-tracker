<script setup lang="ts">
import { nextTick, onUnmounted, useId, useTemplateRef, watch } from 'vue'
import { X } from 'lucide-vue-next'

import { useOverlayState } from '@/composables/useOverlayState'

const props = withDefaults(
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

const titleId = useId()
const panel = useTemplateRef<HTMLElement>('panel')
const overlayState = useOverlayState()
let isRegistered = false
let previousFocus: HTMLElement | null = null

watch(
  () => props.show,
  async (show) => {
    if (show && !isRegistered) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      overlayState.openOverlay()
      isRegistered = true
      await nextTick()
      const autofocusTarget = panel.value?.querySelector<HTMLElement>('[autofocus]')
      const focusTarget = autofocusTarget ?? panel.value
      focusTarget?.focus({ preventScroll: true })
      return
    }

    if (!show && isRegistered) {
      overlayState.closeOverlay()
      isRegistered = false
      await nextTick()
      previousFocus?.focus({ preventScroll: true })
      previousFocus = null
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (isRegistered) {
    overlayState.closeOverlay()
    isRegistered = false
  }
})

function handleBackdropClick(): void {
  emit('close')
}

function handleCloseClick(): void {
  emit('close')
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
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
        class="sheet-backdrop fixed inset-0 z-[70] bg-text/40 px-0 backdrop-blur-sm sm:px-4"
        @click.self="handleBackdropClick"
        @keydown="handleEscape"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <section
            v-if="show"
            ref="panel"
            class="sheet-panel absolute bottom-0 left-0 right-0 flex touch-pan-y flex-col rounded-t-2xl bg-surface shadow-xl sm:relative sm:mx-auto sm:mt-auto sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :aria-label="title ? undefined : '對話視窗'"
            tabindex="-1"
          >
            <div class="flex shrink-0 items-center justify-center pb-2 pt-3">
              <div class="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <div class="flex items-start justify-between gap-4 border-b border-border px-4 pb-3">
              <div class="min-w-0">
                <h2 v-if="title" :id="titleId" class="text-lg font-semibold text-text">
                  {{ title }}
                </h2>
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

            <div class="sheet-scroll min-h-0 flex-1 overflow-y-auto p-4">
              <slot />
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  overscroll-behavior: contain;
}

.sheet-panel {
  height: min(90dvh, 90vh);
  outline: none;
}

.sheet-scroll {
  overscroll-behavior: contain;
  scroll-padding-bottom: calc(6.5rem + env(safe-area-inset-bottom));
}
</style>
