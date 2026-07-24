<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'
import { computed } from 'vue'

import { useConfirmDialog } from '@/composables/useConfirmDialog'

const { active, settle } = useConfirmDialog()

const open = computed({
  get() {
    return Boolean(active.value)
  },
  set(value: boolean) {
    if (!value && active.value) {
      settle(false)
    }
  },
})
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-[110] bg-text/40 backdrop-blur-sm data-[state=open]:animate-[ui-fade-in_180ms_ease] data-[state=closed]:animate-[ui-fade-out_140ms_ease]"
      />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 shadow-xl outline-none data-[state=open]:animate-[ui-dialog-in_220ms_var(--motion-out)] data-[state=closed]:animate-[ui-dialog-out_150ms_ease-in]"
      >
        <AlertDialogTitle class="text-xl font-semibold text-text">
          {{ active?.title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm leading-6 text-text-2">
          {{ active?.description }}
        </AlertDialogDescription>

        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-base font-semibold text-text transition hover:bg-accent"
            @click="settle(false)"
          >
            {{ active?.cancelLabel ?? '取消' }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="inline-flex min-h-11 items-center justify-center rounded-xl bg-danger px-4 py-2.5 text-base font-semibold text-white transition hover:opacity-95"
            @click="settle(true)"
          >
            {{ active?.confirmLabel ?? '確定' }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
