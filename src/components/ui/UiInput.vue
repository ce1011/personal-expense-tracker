<script setup lang="ts">
import { computed, useAttrs, useId, useSlots } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue: string | number
  label?: string
  error?: string
  placeholder?: string
  type?: string
  id?: string
  name?: string
  autocomplete?: string
  inputmode?: 'decimal' | 'numeric' | 'search' | 'text' | 'email' | 'tel' | 'url' | 'none'
  disabled?: boolean
  autofocus?: boolean
  modelModifiers?: { number?: boolean; trim?: boolean }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()
const slots = useSlots()
const generatedId = useId()

const inputId = computed(() => props.id ?? props.name ?? generatedId)

const inputValue = computed<string | number>({
  get() {
    return props.modelValue
  },
  set(value: string | number) {
    const stringValue = String(value)

    if (props.type === 'number' || props.modelModifiers?.number) {
      const parsed = stringValue === '' ? 0 : Number(stringValue)
      emit('update:modelValue', Number.isNaN(parsed) ? 0 : parsed)
      return
    }

    if (props.modelModifiers?.trim) {
      emit('update:modelValue', stringValue.trim())
      return
    }

    emit('update:modelValue', stringValue)
  },
})

const inputClasses = computed(() => [
  'input-base',
  props.error ? 'input-base-error' : '',
  slots.suffix ? 'pr-12' : '',
])
</script>

<template>
  <div class="w-full">
    <UiLabel v-if="label" :for="inputId">{{ label }}</UiLabel>
    <div class="relative">
      <input
        :id="inputId"
        v-model="inputValue"
        v-bind="attrs"
        :type="type ?? 'text'"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :disabled="disabled"
        :autofocus="autofocus"
        :class="inputClasses"
      />
      <div
        v-if="slots.suffix"
        class="absolute inset-y-0 right-1.5 grid place-items-center text-text-3"
      >
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
