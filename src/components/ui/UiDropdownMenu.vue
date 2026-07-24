<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'

export type UiDropdownItem = {
  key: string
  label: string
  description?: string
  disabled?: boolean
  danger?: boolean
}

const props = withDefaults(
  defineProps<{
    open?: boolean
    items?: UiDropdownItem[]
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
  }>(),
  {
    open: undefined,
    items: () => [],
    align: 'end',
    sideOffset: 8,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [key: string]
}>()

const isControlled = computed(() => props.open !== undefined)
</script>

<template>
  <DropdownMenuRoot
    :open="isControlled ? open : undefined"
    @update:open="emit('update:open', $event)"
  >
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="sideOffset"
        class="z-[80] min-w-48 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl outline-none"
      >
        <slot name="header" />

        <DropdownMenuSeparator
          v-if="$slots.header && (items.length || $slots.default)"
          class="my-1 h-px bg-border"
        />

        <template v-if="items.length">
          <DropdownMenuItem
            v-for="item in items"
            :key="item.key"
            :disabled="item.disabled"
            class="flex cursor-pointer select-none flex-col rounded-lg px-2.5 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[disabled]:opacity-50"
            :class="item.danger ? 'text-danger' : 'text-text'"
            @select="emit('select', item.key)"
          >
            <span class="font-medium">{{ item.label }}</span>
            <span v-if="item.description" class="text-xs text-text-2">{{ item.description }}</span>
          </DropdownMenuItem>
        </template>

        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
