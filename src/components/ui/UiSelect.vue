<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { Check, ChevronDown } from 'lucide-vue-next'
import { computed, useId } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

const props = defineProps<{
  modelValue: string | number
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
  id?: string
  name?: string
  disabled?: boolean
  placeholder?: string
  modelModifiers?: { number?: boolean }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const selectId = props.id ?? useId()

const stringValue = computed({
  get() {
    return props.modelValue === undefined || props.modelValue === null
      ? undefined
      : String(props.modelValue)
  },
  set(value: string | undefined) {
    if (value === undefined) {
      return
    }

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

const selectedLabel = computed(() => {
  const matched = props.options.find((option) => String(option.value) === stringValue.value)
  return matched?.label
})
</script>

<template>
  <div class="relative w-full">
    <UiLabel v-if="label" :for="selectId">{{ label }}</UiLabel>
    <SelectRoot v-model="stringValue" :name="name" :disabled="disabled">
      <SelectTrigger
        :id="selectId"
        class="input-base flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-text-3"
        :class="error ? 'input-base-error' : ''"
        aria-label="select"
      >
        <SelectValue :placeholder="placeholder ?? '請選擇'">
          {{ selectedLabel }}
        </SelectValue>
        <SelectIcon as-child>
          <ChevronDown class="size-5 shrink-0 text-text-3" aria-hidden="true" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          class="ui-select-content z-[80] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <SelectViewport class="max-h-64 p-1">
            <SelectItem
              v-for="option in options"
              :key="String(option.value)"
              :value="String(option.value)"
              class="relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-text outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[disabled]:opacity-50"
            >
              <span class="absolute left-2 inline-flex size-4 items-center justify-center">
                <SelectItemIndicator>
                  <Check class="size-3.5 text-primary" aria-hidden="true" />
                </SelectItemIndicator>
              </span>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-select-content {
  width: var(--reka-select-trigger-width);
  max-height: var(--reka-select-content-available-height);
  box-shadow:
    0 18px 50px rgb(67 40 119 / 16%),
    inset 0 1px 0 rgb(255 255 255 / 85%);
}
</style>
