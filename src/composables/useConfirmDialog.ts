import { readonly, shallowRef } from 'vue'

export type ConfirmDialogRequest = {
  id: number
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  resolve: (value: boolean) => void
}

const active = shallowRef<ConfirmDialogRequest | null>(null)
let requestSeq = 0

export function useConfirmDialog() {
  function confirmDanger(options: {
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const previous = active.value
      if (previous) {
        previous.resolve(false)
      }

      active.value = {
        id: ++requestSeq,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? '確定',
        cancelLabel: options.cancelLabel ?? '取消',
        resolve: (value) => {
          if (active.value?.id === requestSeq) {
            active.value = null
          }
          resolve(value)
        },
      }
    })
  }

  function settle(value: boolean): void {
    const current = active.value
    if (!current) {
      return
    }
    active.value = null
    current.resolve(value)
  }

  return {
    active: readonly(active),
    confirmDanger,
    settle,
  }
}
