<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { computed, onUnmounted, watch } from 'vue'

import { useOverlayState } from '@/composables/useOverlayState'

const props = withDefaults(
  defineProps<{
    open?: boolean
    show?: boolean
    title?: string
    subtitle?: string
    maxWidthClass?: string
  }>(),
  {
    open: undefined,
    show: undefined,
    maxWidthClass: 'max-w-md',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const overlayState = useOverlayState()
let isRegistered = false

const isOpen = computed({
  get() {
    return props.open ?? props.show ?? false
  },
  set(value: boolean) {
    emit('update:open', value)
    if (!value) {
      emit('close')
    }
  },
})

watch(
  isOpen,
  (open) => {
    if (open && !isRegistered) {
      overlayState.openOverlay()
      isRegistered = true
      return
    }

    if (!open && isRegistered) {
      overlayState.closeOverlay()
      isRegistered = false
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
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-text/40 backdrop-blur-sm data-[state=open]:animate-[ui-fade-in_200ms_ease] data-[state=closed]:animate-[ui-fade-out_150ms_ease]"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-40 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-4 shadow-xl outline-none data-[state=open]:animate-[ui-dialog-in_220ms_var(--motion-out)] data-[state=closed]:animate-[ui-dialog-out_160ms_ease-in]"
        :class="maxWidthClass"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <DialogTitle v-if="title" class="text-xl font-semibold text-text">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="subtitle" class="mt-1 text-sm text-text-2">
              {{ subtitle }}
            </DialogDescription>
            <DialogTitle v-else class="sr-only">對話框</DialogTitle>
          </div>
          <DialogClose
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            aria-label="關閉"
          >
            <X class="size-5" aria-hidden="true" />
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
