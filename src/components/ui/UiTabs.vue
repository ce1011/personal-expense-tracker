<script setup lang="ts" generic="T extends string">
import { TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

defineProps<{
  modelValue: T
  items: Array<{ value: T; label: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    class="w-full"
    @update:model-value="emit('update:modelValue', $event as T)"
  >
    <TabsList class="inline-flex w-full rounded-xl border border-border bg-accent p-1">
      <TabsTrigger
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        class="min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-text-2 transition data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-sm hover:text-text"
      >
        {{ item.label }}
      </TabsTrigger>
    </TabsList>
  </TabsRoot>
</template>
