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
      class="fixed inset-0 z-40 grid place-items-center bg-stone-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-full rounded-md bg-[#f9f6ef] p-4 shadow-xl" :class="maxWidth">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 v-if="title" class="text-xl font-semibold text-stone-950">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-sm text-stone-500">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="rounded-md border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-50"
            aria-label="關閉"
            @click="emit('close')"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <slot />
      </div>
    </div>
  </Transition>
</template>
