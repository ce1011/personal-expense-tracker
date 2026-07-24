<script setup lang="ts">
import {
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from 'reka-ui'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { computed, useId } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    error?: string
    id?: string
    name?: string
    disabled?: boolean
    min?: number
    max?: number
    step?: number
    formatOptions?: Intl.NumberFormatOptions
  }>(),
  {
    step: 1,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const fieldId = props.id ?? useId()

const value = computed({
  get() {
    return props.modelValue
  },
  set(next: number | undefined) {
    emit('update:modelValue', typeof next === 'number' && !Number.isNaN(next) ? next : 0)
  },
})
</script>

<template>
  <div class="w-full">
    <UiLabel v-if="label" :for="fieldId">{{ label }}</UiLabel>
    <NumberFieldRoot
      v-model="value"
      :id="fieldId"
      :name="name"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :format-options="formatOptions"
      class="relative"
    >
      <NumberFieldInput
        class="input-base pr-12"
        :class="error ? 'input-base-error' : ''"
      />
      <div class="absolute inset-y-1.5 right-1.5 flex flex-col overflow-hidden rounded-lg border border-border bg-accent/40">
        <NumberFieldIncrement
          class="grid h-1/2 w-8 place-items-center text-text-2 transition hover:bg-accent disabled:opacity-40"
          aria-label="增加"
        >
          <ChevronUp class="size-3.5" aria-hidden="true" />
        </NumberFieldIncrement>
        <NumberFieldDecrement
          class="grid h-1/2 w-8 place-items-center text-text-2 transition hover:bg-accent disabled:opacity-40"
          aria-label="減少"
        >
          <ChevronDown class="size-3.5" aria-hidden="true" />
        </NumberFieldDecrement>
      </div>
    </NumberFieldRoot>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
