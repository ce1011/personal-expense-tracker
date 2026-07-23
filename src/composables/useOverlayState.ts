import { computed, shallowRef } from 'vue'

const activeOverlayCount = shallowRef(0)
let previousBodyOverflow = ''

function lockPageScroll(): void {
  if (typeof document === 'undefined' || activeOverlayCount.value !== 0) {
    return
  }

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockPageScroll(): void {
  if (typeof document === 'undefined' || activeOverlayCount.value !== 0) {
    return
  }

  document.body.style.overflow = previousBodyOverflow
}

export function useOverlayState() {
  const isOverlayOpen = computed(() => activeOverlayCount.value > 0)

  function openOverlay(): void {
    lockPageScroll()
    activeOverlayCount.value += 1
  }

  function closeOverlay(): void {
    activeOverlayCount.value = Math.max(0, activeOverlayCount.value - 1)
    unlockPageScroll()
  }

  return {
    isOverlayOpen,
    openOverlay,
    closeOverlay,
  }
}
