<script setup lang="ts">
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
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
  }>(),
  {
    open: undefined,
    show: undefined,
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

function handleOpenChange(value: boolean): void {
  isOpen.value = value
}
</script>

<template>
  <DrawerRoot :open="isOpen" modal swipe-direction="down" @update:open="handleOpenChange">
    <DrawerPortal>
      <DrawerOverlay class="ui-drawer-overlay fixed inset-0 z-[70] bg-text/40 backdrop-blur-sm" />
      <DrawerContent
        class="ui-drawer-content fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(92dvh,52rem)] flex-col rounded-t-[1.75rem] border border-border bg-surface shadow-2xl outline-none sm:inset-x-4 sm:bottom-4 sm:max-w-lg sm:mx-auto sm:rounded-3xl"
      >
        <DrawerHandle class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

        <header class="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
          <div class="min-w-0">
            <DrawerTitle v-if="title" class="text-xl font-semibold tracking-tight text-text">
              {{ title }}
            </DrawerTitle>
            <DrawerDescription v-if="subtitle" class="mt-1 text-sm text-text-2">
              {{ subtitle }}
            </DrawerDescription>
            <DrawerTitle v-else class="sr-only">面板</DrawerTitle>
          </div>

          <DrawerClose
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            aria-label="關閉"
          >
            <X class="size-5" aria-hidden="true" />
          </DrawerClose>
        </header>

        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5"
        >
          <slot />
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.ui-drawer-overlay {
  transition: opacity 200ms ease;
}

.ui-drawer-overlay[data-state='open'] {
  animation: ui-drawer-overlay-in 200ms ease forwards;
}

.ui-drawer-overlay[data-state='closed'] {
  animation: ui-drawer-overlay-out 160ms ease forwards;
}

.ui-drawer-content {
  transform: translate3d(0, var(--drawer-swipe-movement-y, 0px), 0);
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow:
    0 -20px 60px rgb(34 22 58 / 18%),
    inset 0 1px 0 rgb(255 255 255 / 85%);
}

.ui-drawer-content[data-state='open'] {
  animation: ui-drawer-slide-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ui-drawer-content[data-state='closed'] {
  animation: ui-drawer-slide-out 220ms ease-in forwards;
}

.ui-drawer-content[data-swiping] {
  transition-duration: 0ms;
}

@keyframes ui-drawer-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes ui-drawer-overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes ui-drawer-slide-in {
  from {
    translate: 0 100%;
  }
  to {
    translate: 0 0;
  }
}

@keyframes ui-drawer-slide-out {
  from {
    translate: 0 0;
  }
  to {
    translate: 0 100%;
  }
}
</style>
