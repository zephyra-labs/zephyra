import { ref, readonly, onMounted } from 'vue'
import { getAddress } from 'ethers'
import { Chain } from '~/config/chain'
import { useApi } from './useApi'
import type { WalletLog } from '~/types/Wallet'
import { useUserStore } from '~/stores/userStore'

const account = ref<string | null>(null)
const walletClient = ref<any>(null)
const listenersAttached = ref(false)
let addActivityLog: ((account: string, log: any) => Promise<any>) | undefined

async function initActivityLogs() {
  if (!addActivityLog) {
    const composable = await import('~/composables/useActivityLogs')
    addActivityLog = composable.useActivityLogs().addActivityLog
  }
}

const handleAccountsChanged = (accounts: string[]) => {
  account.value = accounts.length > 0 ? getAddress(accounts[0] as string) : null
}

async function initWallet(userStore: ReturnType<typeof useUserStore>) {
  if (typeof window === 'undefined') return
  if (!window.ethereum) return
  await initActivityLogs()

  try {
    const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts.length > 0) account.value = getAddress(accounts[0] as string)

    // --- Token handling ---
    const token = localStorage.getItem('token')
    if (account.value && !token) {
      await userStore.walletConnect(account.value)
    }

    if (!walletClient.value && account.value) {
      const { createWalletClient, custom } = await import('viem')
      walletClient.value = createWalletClient({
        transport: custom(window.ethereum),
        chain: Chain,
      })
    }
  } catch (err) {
    console.warn('Failed to check wallet accounts', err)
  }

  if (!listenersAttached.value) {
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    listenersAttached.value = true
  }
}

export function useWallet() {
  const { request } = useApi()
  const userStore = useUserStore()

  onMounted(() => {
    initWallet(userStore)
  })

  async function connectWallet(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    if (!window.ethereum) throw new Error('MetaMask not installed')
    await initActivityLogs()

    const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    account.value = accounts.length > 0 ? getAddress(accounts[0] as string) : null

    if (!walletClient.value && account.value) {
      const { createWalletClient, custom } = await import('viem')
      walletClient.value = createWalletClient({
        transport: custom(window.ethereum),
        chain: Chain,
      })
    }

    if (!listenersAttached.value) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      listenersAttached.value = true
    }

    if (account.value) {
      await userStore.walletConnect(account.value).catch(err => console.warn('walletConnect failed:', err))
      await addActivityLog?.(account.value, {
        type: 'backend',
        action: 'walletConnect',
        tags: ['wallet', 'connect'],
      }).catch(err => console.warn('Activity log failed:', err))
      await request('/wallet/log-login', {
        method: 'POST',
        body: JSON.stringify({ account: account.value }),
      }).catch(err => console.warn('Wallet log-login failed:', err))
    }

    return account.value
  }

  async function disconnectWallet() {
    if (!account.value) return
    await initActivityLogs()

    // Log activity disconnect
    await addActivityLog?.(account.value, {
      type: 'backend',
      action: 'walletDisconnect',
      tags: ['wallet', 'disconnect'],
    }).catch(err => console.warn('Activity log failed:', err))

    await request('/wallet/log-disconnect', {
      method: 'POST',
      body: JSON.stringify({ account: account.value }),
    }).catch(err => console.warn('Wallet log-disconnect failed:', err))

    // --- Reset state ---
    account.value = null
    walletClient.value = null
    userStore.resetCurrentUser() // <-- Pinia store reset
  }

  async function fetchAllWalletLogs(): Promise<WalletLog[]> {
    try {
      const data: WalletLog[] = await request('/wallet/logs')
      return data
        .map((log, idx) => ({ ...log, timestamp: Number(log.timestamp), _idx: idx }))
        .sort((a, b) => b.timestamp - a.timestamp || b._idx - a._idx)
    } catch (err) {
      console.warn('Failed to fetch wallet logs:', err)
      return []
    }
  }

  return {
    account: readonly(account),
    walletClient,
    currentUser: userStore.currentUser,
    connectWallet,
    disconnectWallet,
    fetchAllWalletLogs,
  }
}
