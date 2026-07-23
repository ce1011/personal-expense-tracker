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
  default: 'base-card rounded-2xl border border-border bg-surface p-4 shadow-sm',
  primary: 'base-card rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm',
  warning: 'base-card rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-sm',
  danger: 'base-card rounded-2xl border border-danger/30 bg-danger/5 p-4 shadow-sm',
}
</script>

<template>
  <article :class="variantClasses[variant]">
    <slot />
  </article>
</template>

<style scoped>
.base-card {
  box-shadow:
    0 1px 2px rgb(34 22 58 / 4%),
    0 12px 36px rgb(67 40 119 / 4%);
  transition:
    border-color 240ms ease,
    box-shadow 240ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .base-card:hover {
    border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
    box-shadow:
      0 2px 4px rgb(34 22 58 / 5%),
      0 18px 48px rgb(67 40 119 / 8%);
    transform: translateY(-1px);
  }
}
</style>
