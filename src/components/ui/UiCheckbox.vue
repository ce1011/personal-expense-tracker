<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { useId } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

const props = defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checkboxId = props.id ?? useId()
</script>

<template>
  <div class="flex items-center gap-3">
    <CheckboxRoot
      :id="checkboxId"
      :model-value="modelValue"
      :disabled="disabled"
      class="grid size-5 shrink-0 place-items-center rounded border border-border bg-surface text-primary shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
      @update:model-value="emit('update:modelValue', $event === true)"
    >
      <CheckboxIndicator class="grid place-items-center text-current">
        <Check class="size-3.5" aria-hidden="true" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <UiLabel
      v-if="label || $slots.default"
      :for="checkboxId"
      class="!mb-0 cursor-pointer text-sm font-medium text-text"
    >
      <slot>{{ label }}</slot>
    </UiLabel>
  </div>
</template>
