import { ref, computed } from 'vue'
import { createPublicClient, http, formatEther, type BlockTag } from 'viem'
import { Chain as localChain } from '../config/chain'
import { useApi } from './useApi'
import { useUserStore } from '~/stores/userStore'
import type { Wallet } from '~/types/Wallet'
import type { RecentTx } from '~/types/Transaction'
import type { DashboardData } from '~/types/Dashboard'

export function useDashboard() {
  // --- State ---
  const { request } = useApi()
  const userStore = useUserStore()

  const wallets = ref<Wallet[]>([])
  const deployedContracts = ref<`0x${string}`[]>([])
  const recentTxs = ref<RecentTx[]>([])
  const loading = ref(false)

  const adminDashboard = ref<DashboardData | null>(null)
  const userDashboard = ref<DashboardData | null>(null)
  const error = ref<string | null>(null)

  const client = createPublicClient({
    chain: localChain,
    transport: http(localChain.rpcUrls.default.http[0]),
  })

  // --- Computed ---
  const totalWallets = computed(() => wallets.value.length)
  const totalContracts = computed(() => deployedContracts.value.length)
  const totalRecentTxs = computed(() => recentTxs.value.length)

  // ✅ 1. Ambil Wallet dari Database Users
  const fetchWalletsFromUsers = async () => {
    const users = await userStore.fetchAll()

    // Filter hanya address valid (0x...)
    const addresses = users
      .map(u => u.address?.toLowerCase() as `0x${string}`)
      .filter(addr => addr?.startsWith('0x'))

    const results: Wallet[] = []
    for (const addr of addresses) {
      try {
        const balance = await client.getBalance({ address: addr })
        results.push({
          address: addr,
          balance: Number(formatEther(balance)),
        })
      } catch (e) {
        console.warn(`Failed get balance for ${addr}`, e)
      }
    }

    wallets.value = results
  }

  // ✅ 2. Ambil Kontrak & Transaksi dari Blockchain
  const fetchBlockchainData = async () => {
    const latestBlock = await client.getBlock({ blockTag: 'latest' })
    if (!latestBlock?.number) throw new Error('Cannot fetch latest block number')

    const contractsSet = new Set<`0x${string}`>()
    const allTxs: RecentTx[] = []

    for (let i = 0; i <= latestBlock.number; i++) {
      const block = await client.getBlock({
        blockTag: i as unknown as BlockTag,
        includeTransactions: true,
      })
      if (!block) continue

      for (const tx of block.transactions) {
        allTxs.push({
          from: tx.from,
          to: (tx.to ?? '0x0') as `0x${string}`,
          value: Number(tx.value) / 1e18,
          hash: tx.hash,
        })

        // Contract deployment
        if (!tx.to) {
          const receipt = await client.getTransactionReceipt({ hash: tx.hash })
          if (receipt?.contractAddress) {
            contractsSet.add(receipt.contractAddress as `0x${string}`)
          }
        }
      }
    }

    deployedContracts.value = Array.from(contractsSet)
    recentTxs.value = allTxs.slice(-5)
  }

  // ✅ 3. Fetch Dashboard On-Chain (Wallet + Contracts + Recent Tx)
  const fetchOnChainDashboard = async () => {
    loading.value = true
    try {
      await Promise.all([
        fetchWalletsFromUsers(),
        fetchBlockchainData(),
      ])
    } catch (err) {
      console.error('Error fetching on-chain dashboard:', err)
    } finally {
      loading.value = false
    }
  }

  // ✅ 4. Fetch Admin Dashboard dari Backend
  const fetchAdminDashboard = async (): Promise<DashboardData | null> => {
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: DashboardData }>('/dashboard/admin')
      adminDashboard.value = data.data
      return data.data
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch admin dashboard'
      return null
    } finally {
      loading.value = false
    }
  }

  // ✅ 5. Fetch User Dashboard dari Backend
  const fetchUserDashboard = async (): Promise<DashboardData | null> => {
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: DashboardData }>('/dashboard/user')
      userDashboard.value = data.data
      return data.data
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch user dashboard'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    wallets,
    deployedContracts,
    recentTxs,
    adminDashboard,
    userDashboard,
    loading,
    error,

    // computed
    totalWallets,
    totalContracts,
    totalRecentTxs,

    // methods
    fetchOnChainDashboard,
    fetchAdminDashboard,
    fetchUserDashboard,
    fetchWalletsFromUsers,
    fetchBlockchainData,
  }
}
