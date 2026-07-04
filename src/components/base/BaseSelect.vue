<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string | number
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
  id?: string
  name?: string
  disabled?: boolean
  modelModifiers?: { number?: boolean }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const selectId = computed(
  () => props.id ?? props.name ?? `base-select-${Math.random().toString(36).slice(2, 9)}`,
)

const selectValue = computed({
  get() {
    return props.modelValue
  },
  set(value: string) {
    const matched = props.options.find((option) => String(option.value) === value)

    if (matched) {
      emit('update:modelValue', matched.value)
      return
    }

    if (props.modelModifiers?.number) {
      emit('update:modelValue', value === '' ? 0 : Number(value))
      return
    }

    emit('update:modelValue', value)
  },
})

const selectClasses = computed(() => [
  'input-base appearance-none pr-10',
  props.error ? 'input-base-error' : '',
])
</script>

<template>
  <div class="relative w-full">
    <label v-if="label" :for="selectId" class="mb-1.5 block text-sm font-medium text-text-2">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="selectId"
        v-model="selectValue"
        :name="name"
        :disabled="disabled"
        :class="selectClasses"
      >
        <option v-for="option in options" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-text-3"
        aria-hidden="true"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
