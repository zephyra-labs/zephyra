import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
  progress?: number
}

const toasts = ref<ToastMessage[]>([])
let counter = 0

export function useToast() {
  const addToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = ++counter
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, addToast, removeToast }
}
