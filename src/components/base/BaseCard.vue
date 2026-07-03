<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'warning' | 'danger'
  }>(),
  {
    variant: 'default',
  },
)

const variantClasses: Record<string, string> = {
  default: 'rounded-2xl border border-border bg-surface p-4 shadow-sm',
  primary: 'rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm',
  warning: 'rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-sm',
  danger: 'rounded-2xl border border-danger/30 bg-danger/5 p-4 shadow-sm',
}
</script>

<template>
  <article :class="variantClasses[variant]">
    <slot />
  </article>
</template>
