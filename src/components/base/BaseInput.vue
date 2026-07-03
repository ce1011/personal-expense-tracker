<script setup lang="ts">
import { computed } from 'vue'

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
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = computed(
  () => props.id ?? props.name ?? `base-input-${Math.random().toString(36).slice(2, 9)}`,
)

const inputValue = computed({
  get() {
    return props.modelValue
  },
  set(value: string) {
    emit('update:modelValue', value)
  },
})

const inputClasses = computed(() => ['input-base', props.error ? 'input-base-error' : ''])
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="mb-1.5 block text-sm font-medium text-text-2">
      {{ label }}
    </label>
    <input
      :id="inputId"
      v-model="inputValue"
      :type="type ?? 'text'"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :disabled="disabled"
      :autofocus="autofocus"
      :class="inputClasses"
    />
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
