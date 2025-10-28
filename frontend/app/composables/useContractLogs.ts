import { reactive, ref, onMounted } from 'vue'
import { useApi } from './useApi'
import type { ContractLogEntry, ContractLogPayload, ContractState } from '~/types/Contract'

interface ContractDetailsResponse {
  success: boolean
  data: {
    contractAddress: string
    state: Partial<ContractState>
    history: ContractLogEntry[]
  }
}

interface ContractListResponse {
  success: boolean
  data: {
    chainContracts: string[]
    backendLogs: ContractLogEntry[]
  }
}

export function useContractLogs() {
  const logs = ref<string[]>([])
  const backendLogs = ref<Record<string, ContractLogEntry[]>>({})
  const loading = ref(true)

  const contractStates = reactive<Record<string, ContractState>>({})

  const { request } = useApi()

  const initialContractState = (): ContractState => ({
    isOpen: false,
    history: [],
    loading: false,
    finished: false,
    lastTimestamp: undefined,
    role: 'Guest',
    status: undefined,
    currentStage: undefined,
    lastUpdated: undefined,
    name: undefined,
    documentCount: 0,
  })

  const getContractState = (contract: string): ContractState => {
    if (!contractStates[contract]) {
      contractStates[contract] = initialContractState()
    }
    return contractStates[contract]
  }

  const updateStateFromLogs = (contract: string) => {
    const state = getContractState(contract)
    const history = backendLogs.value[contract] ?? state.history ?? []

    if (!history.length) {
      console.warn('[updateStateFromLogs] No history for', contract)
      return
    }

    const lastLog = history.at(-1)
    if (!lastLog) return

    state.history = [...history] // pastikan reactive update
    state.lastTimestamp = lastLog.timestamp ?? state.lastTimestamp
    state.finished = ['complete', 'finalize'].includes(lastLog.action?.toLowerCase() ?? '')
    state.status = lastLog.extra?.status ?? lastLog.action ?? state.status
    state.currentStage = lastLog.extra?.stage ?? history.length ?? state.currentStage

    state.exporter = lastLog.extra?.exporter ?? state.exporter
    state.importer = lastLog.extra?.importer ?? state.importer
    state.logistics = lastLog.extra?.logistics ?? state.logistics
    state.insurance = lastLog.extra?.insurance ?? state.insurance
    state.inspector = lastLog.extra?.inspector ?? state.inspector
    state.lastUpdated = lastLog.timestamp ?? state.lastUpdated
  }

  const fetchContracts = async () => {
    loading.value = true
    try {
      const res = await request<ContractListResponse>('/contract')
      const chainContracts = res.data.chainContracts ?? []
      const backend = res.data.backendLogs ?? []

      logs.value = chainContracts
      logs.value.forEach((c) => getContractState(c))

      backend.forEach((log) => {
        const addr = log.contractAddress
        if (!addr) return
        backendLogs.value[addr] = backendLogs.value[addr] ?? []
        backendLogs.value[addr].push(log)
        updateStateFromLogs(addr)
      })
    } catch (err) {
      console.error('[fetchContracts] Failed:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchContractLogs = async (contract: string) => {
    const state = getContractState(contract)
    if (state.loading || state.finished) return

    state.loading = true
    try {
      const res = await request<ContractDetailsResponse>(`/contract/${contract}/details`)
      const backend: ContractLogEntry[] = res.data.history ?? []

      if (backend.length) {
        backendLogs.value[contract] = backend
        updateStateFromLogs(contract)
      }
    } catch (err) {
      console.error(`[fetchContractLogs] Failed for ${contract}:`, err)
    } finally {
      state.loading = false
    }
  }

  const addContractLog = async (contract: string, log: ContractLogPayload) => {
    try {
      const payload: ContractLogPayload = { ...log, contractAddress: contract }
      const res = await request<{ success: boolean; log: ContractLogEntry }>('/contract/log', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = res.log
      if (!data) return console.warn('[addContractLog] Response missing log')

      backendLogs.value[contract] = [...(backendLogs.value[contract] ?? []), data]
      updateStateFromLogs(contract)
      return data
    } catch (err) {
      console.error('[addContractLog] Failed:', err)
      throw err
    }
  }

  const toggleContract = async (contract: string) => {
    const state = getContractState(contract)
    state.isOpen = !state.isOpen

    if (state.isOpen && state.history.length === 0) {
      await fetchContractLogs(contract)
    }
  }

  const refreshContractLogs = async (contract: string) => {
    backendLogs.value[contract] = []
    const state = getContractState(contract)
    state.history = []
    state.lastTimestamp = undefined
    state.finished = false
    state.status = undefined
    state.currentStage = undefined
    state.lastUpdated = undefined
    await fetchContractLogs(contract)
  }

  onMounted(fetchContracts)

  return {
    logs,
    backendLogs,
    loading,
    contractStates,
    getContractState,
    toggleContract,
    fetchContracts,
    fetchContractLogs,
    addContractLog,
    refreshContractLogs,
  }
}
