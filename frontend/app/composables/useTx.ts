import { ref } from 'vue'
import { useToast } from './useToast'

const isTxPending = ref(false)
const { addToast } = useToast()

export function useTx() {
  async function withTx<T>(
    fn: () => Promise<T>,
    { label }: { label: string }
  ): Promise<T | null> {
    if (isTxPending.value) {
      addToast(`${label} is already pending`, 'warning')
      return null
    }

    try {
      isTxPending.value = true
      addToast(`${label} started`, 'info', 2000)
      const result = await fn()
      addToast(`${label} succeeded`, 'success')
      return result
    } catch (err: any) {
      addToast(`${label} failed: ${err?.message || err}`, 'error', 5000)
      return null
    } finally {
      isTxPending.value = false
    }
  }

  return { isTxPending, withTx }
}
