import { computed, shallowRef } from 'vue'

/**
 * Tracks open overlay chrome (bottom tab bar / FAB hide).
 * Body scroll lock and focus trap are owned by Reka modal primitives.
 */
const activeOverlayCount = shallowRef(0)

export function useOverlayState() {
  const isOverlayOpen = computed(() => activeOverlayCount.value > 0)

  function openOverlay(): void {
    activeOverlayCount.value += 1
  }

  function closeOverlay(): void {
    activeOverlayCount.value = Math.max(0, activeOverlayCount.value - 1)
  }

  return {
    isOverlayOpen,
    openOverlay,
    closeOverlay,
  }
}
