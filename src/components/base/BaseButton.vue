<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'fab'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    type: 'button',
  },
)

const emit = defineEmits<{
  click: []
}>()

const variantClasses: Record<string, string> = {
  primary:
    'inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-border bg-surface px-4 py-2.5 text-base font-semibold text-text transition hover:bg-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'inline-flex items-center justify-center gap-2 min-h-11 rounded-xl px-4 py-2.5 text-base font-medium text-text-2 transition hover:bg-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-danger/20 bg-surface px-4 py-2.5 text-base font-semibold text-danger transition hover:bg-danger/5 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  fab: 'fixed bottom-20 right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
}

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <button
    :type="type"
    :class="variantClasses[variant]"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <slot />
  </button>
</template>
