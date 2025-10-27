import { ref, reactive, onMounted } from 'vue'
import { useApi } from './useApi'
import { useDocuments } from './useDocuments'
import type { MyContractData, ContractState } from '~/types/Contract'

export function useContracts() {
  const contracts = ref<string[]>([])
  const contractStates = reactive<Record<string, ContractState>>({})
  const loading = ref(true)

  const { request } = useApi()
  const { getDocumentsByContract } = useDocuments()

  const getContractState = (contract: string) => {
    if (!contractStates[contract]) {
      contractStates[contract] = {
        isOpen: false,
        history: [],
        loading: false,
        finished: false,
        lastTimestamp: undefined,
        role: 'Guest',
        documentCount: 0,
      } as ContractState & { documentCount: number }
    }
    return contractStates[contract]
  }

  /** Fetch contracts user */
  const fetchMyContracts = async () => {
    loading.value = true
    try {
      const res = await request<{ success: boolean; data: MyContractData[] }>('/contract/my')
      const myContractsData = res.data ?? []

      const validContracts: string[] = []

      // Loop setiap contract user
      for (const contractData of myContractsData) {
        const addr = contractData.contractAddress
        const role = contractData.role

        if (!addr || !role) continue

        const state = getContractState(addr)
        state.history = contractData.history ?? []
        state.role = role
        const lastAction = state.history[state.history.length - 1]?.action.toLowerCase()
        if (lastAction === 'complete') {
          state.finished = true
        }
        state.loading = false
        state.lastTimestamp = contractData.history?.[contractData.history.length - 1]?.timestamp

        try {
          const docs = await getDocumentsByContract(addr)
          state.documentCount = docs.length
        } catch (e) {
          console.error(`Failed to fetch documents for contract ${addr}:`, e)
          state.documentCount = 0
        }

        validContracts.push(addr)
      }

      contracts.value = validContracts
    } catch (err) {
      console.error('Failed to fetch my contracts:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchMyContracts()
  })

  return {
    contracts,
    contractStates,
    loading,
    getContractState,
    fetchMyContracts,
  }
}
