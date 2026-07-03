import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useIsMobile() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  function handleResize() {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return computed(() => width.value < 768)
}
