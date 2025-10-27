import { ref, computed } from 'vue'
import { useWallet } from '~/composables/useWallets'
import { useRegistryKYC } from './useRegistryKYC'

/**
 * KYC role helper
 * Tidak tergantung kontrak
 */
export function useKycRole() {
  const { account } = useWallet()
  const { isMinter: isKycMinter } = useRegistryKYC()

  // Hardcoded admin wallet
  const adminAddress = ref<`0x${string}`>('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const isAdmin = computed(() => account.value === adminAddress.value)

  // ---------------- Approved KYC Minters ----------------
  const approvedMintersKYC = ref<string[]>([])
  const loadingMintersKYC = ref(false)

  const fetchApprovedMintersKYC = async (addresses: `0x${string}`[]) => {
    loadingMintersKYC.value = true
    try {
      const results = await Promise.all(addresses.map(addr => isKycMinter(addr)))
      approvedMintersKYC.value = addresses.filter((_, idx) => results[idx])
    } catch (err) {
      console.error('[fetchApprovedMintersKYC] Failed:', err)
      approvedMintersKYC.value = []
    } finally {
      loadingMintersKYC.value = false
    }
  }

  return {
    isAdmin,
    approvedMintersKYC,
    loadingMintersKYC,
    fetchApprovedMintersKYC,
  }
}
