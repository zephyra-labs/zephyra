import { ref, readonly, watch, onMounted } from 'vue'
import { Chain } from '~/config/chain'
import { createPublicClient, http } from 'viem'
import { useWallet } from '~/composables/useWallets'
import { useMockUSDC } from '~/composables/useMockUSDC'

const nativeBalance = ref<number | null>(null)
const usdcBalance = ref<number | null>(null)
const loading = ref(false)

const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

export function useBalance() {
  const { account } = useWallet()
  const { getBalance: getUSDCBalance } = useMockUSDC()

  async function fetchBalances() {
    if (!account.value) return
    loading.value = true

    try {
      // Native ETH
      const bal = await publicClient.getBalance({ address: account.value as `0x${string}` })
      nativeBalance.value = Number(bal) / 1e18
    } catch (err) {
      console.warn('Failed to fetch native balance', err)
      nativeBalance.value = null
    }

    try {
      // MockUSDC
      usdcBalance.value = await getUSDCBalance(account.value as `0x${string}`)
    } catch (err) {
      console.warn('Failed to fetch USDC balance', err)
      usdcBalance.value = null
    }

    loading.value = false
  }

  // Refresh when account changes
  watch(account, () => {
    fetchBalances()
  })

  // Fetch once on mount if already connected
  onMounted(() => {
    if (account.value) fetchBalances()
  })

  return {
    nativeBalance: readonly(nativeBalance),
    usdcBalance: readonly(usdcBalance),
    loading: readonly(loading),
    fetchBalances,
  }
}
