<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'
import { Check, X } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <ToastProvider :duration="2400" label="通知" swipe-direction="right">
    <slot />

    <ToastRoot
      v-for="item in toasts"
      :key="item.id"
      :duration="item.duration"
      class="ui-toast pointer-events-auto relative overflow-hidden rounded-2xl border border-primary/20 bg-surface px-4 py-3 text-body-sm font-semibold text-primary shadow-lg data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)] data-[state=closed]:animate-[ui-toast-out_160ms_ease-in] data-[state=open]:animate-[ui-toast-in_220ms_var(--motion-out)] data-[swipe=end]:animate-[ui-toast-swipe-out_100ms_ease-out]"
      @update:open="(open) => !open && dismiss(item.id)"
    >
      <div class="flex items-start gap-2 pr-6">
        <span
          class="ui-toast__icon mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success/10 text-success"
        >
          <Check class="size-3.5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <ToastTitle v-if="item.title" class="text-sm font-semibold text-text">
            {{ item.title }}
          </ToastTitle>
          <ToastDescription class="text-body-sm font-semibold text-primary">
            {{ item.description }}
          </ToastDescription>
        </div>
      </div>
      <ToastClose
        class="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-text-3 transition hover:bg-accent hover:text-text"
        aria-label="關閉通知"
      >
        <X class="size-3.5" aria-hidden="true" />
      </ToastClose>
      <span
        class="ui-toast__timer absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-success to-primary"
        :style="{ animationDuration: `${item.duration}ms` }"
      />
    </ToastRoot>

    <ToastViewport
      class="fixed bottom-24 left-4 right-4 z-[100] mx-auto flex max-w-sm flex-col gap-2 outline-none sm:bottom-8 sm:left-auto sm:right-4 sm:mx-0"
    />
  </ToastProvider>
</template>

<style scoped>
.ui-toast {
  box-shadow:
    0 18px 50px rgb(67 40 119 / 18%),
    inset 0 1px 0 rgb(255 255 255 / 80%);
  backdrop-filter: blur(18px);
}

.ui-toast__icon {
  animation: ui-toast-check 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ui-toast__timer {
  animation: ui-toast-timer linear forwards;
}

@keyframes ui-toast-check {
  from {
    opacity: 0;
    transform: rotate(-24deg) scale(0.4);
  }
}

@keyframes ui-toast-timer {
  to {
    transform: scaleX(0);
  }
}
</style>
