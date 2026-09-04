import { readonly, shallowRef } from 'vue'

export type ToastMessage = {
  id: string
  title?: string
  description: string
  duration: number
}

const toasts = shallowRef<ToastMessage[]>([])

let toastSeq = 0

export function useToast() {
  function toast(input: { title?: string; description: string; duration?: number }): string {
    const id = `toast-${++toastSeq}-${Date.now()}`
    const next: ToastMessage = {
      id,
      title: input.title,
      description: input.description,
      duration: input.duration ?? 2400,
    }
    toasts.value = [...toasts.value, next]
    return id
  }

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  function clear(): void {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
    clear,
  }
}
