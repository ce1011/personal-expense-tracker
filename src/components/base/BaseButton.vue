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
    'base-button base-button--primary inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-white focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'base-button base-button--secondary inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-border bg-surface px-4 py-2.5 text-base font-semibold text-text focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'base-button base-button--ghost inline-flex items-center justify-center gap-2 min-h-11 rounded-xl px-4 py-2.5 text-base font-medium text-text-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'base-button base-button--danger inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-danger/20 bg-surface px-4 py-2.5 text-base font-semibold text-danger focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  fab: 'base-button base-button--primary fixed bottom-20 right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
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
    <span class="base-button__sheen" aria-hidden="true" />
    <span
      v-if="loading"
      class="relative z-10 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <span class="relative z-10 contents"><slot /></span>
  </button>
</template>

<style scoped>
.base-button {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 1px 1px rgb(34 22 58 / 4%);
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 220ms ease,
    transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.base-button:not(:disabled):active {
  box-shadow: none;
  transform: translateY(1px) scale(0.975);
}

.base-button--primary {
  box-shadow:
    0 10px 24px rgb(124 58 237 / 22%),
    inset 0 1px 0 rgb(255 255 255 / 22%);
}

.base-button--primary:hover:not(:disabled) {
  background: var(--color-primary-2);
  box-shadow:
    0 14px 30px rgb(91 33 182 / 28%),
    inset 0 1px 0 rgb(255 255 255 / 22%);
  transform: translateY(-1px);
}

.base-button--secondary:hover:not(:disabled),
.base-button--ghost:hover:not(:disabled) {
  background: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
}

.base-button--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-danger) 6%, white);
  border-color: color-mix(in srgb, var(--color-danger) 34%, transparent);
}

.base-button__sheen {
  position: absolute;
  top: -100%;
  bottom: -100%;
  left: -55%;
  width: 35%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 26%), transparent);
  opacity: 0;
  content: '';
  transform: rotate(18deg);
}

.base-button--primary:hover:not(:disabled) .base-button__sheen {
  animation: button-sheen 700ms ease;
}

@keyframes button-sheen {
  0% {
    opacity: 0;
    transform: translateX(0) rotate(18deg);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(420%) rotate(18deg);
  }
}
</style>
