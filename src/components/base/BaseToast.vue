<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  message: string
  duration?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | undefined

function scheduleClose(): void {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    visible.value = false
    emit('close')
  }, props.duration ?? 2400)
}

watch(
  () => props.message,
  (message) => {
    if (!message) {
      visible.value = false
      return
    }

    visible.value = true
    scheduleClose()
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(timeoutId)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="visible"
      class="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-primary/20 bg-surface px-4 py-3 text-center text-body-sm font-semibold text-primary shadow-lg sm:bottom-8 sm:right-4 sm:left-auto sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </div>
  </Transition>
</template>
