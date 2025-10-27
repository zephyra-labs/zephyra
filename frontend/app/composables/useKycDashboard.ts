  import { ref, onMounted } from 'vue'
  import { useRegistryKYC } from '~/composables/useRegistryKYC'
  import { useWallet } from '~/composables/useWallets'
  import { useKYC } from '~/composables/useKycs'
  import { useStorage } from '~/composables/useStorage'
  import { useKycRole } from '~/composables/useKycRole'
  import { useDashboard } from '~/composables/useDashboard'
  import { useToast } from '~/composables/useToast'
  import type { KYC } from '~/types/Kyc'

  export function useKycDashboard() {
    // --- WALLET ---
    const { walletClient, account } = useWallet()

    // --- REGISTRY / CONTRACT ---
    const {
      mintDocument,
      getTokenIdByHash,
      addMinter,
      removeMinter,
      reviewDocument,
      signDocument,
      revokeDocument,
    } = useRegistryKYC()

    // --- STORAGE & BACKEND KYC ---
    const { uploadToLocal } = useStorage()
    const { createKyc, getKycById } = useKYC()

    // --- DASHBOARD ---
    const { wallets, fetchWalletsFromUsers } = useDashboard()

    // --- TOAST ---
    const { addToast } = useToast()

    // --- STATE ---
    const selectedFile = ref<File | null>(null)
    const tokenId = ref<bigint | null>(null)
    const nftInfo = ref<KYC | null>(null)
    const error = ref<string | null>(null)
    const success = ref<string | null>(null)
    const minterAddress = ref('')
    const addingMinter = ref(false)
    const removingMinter = ref(false)
    const processing = ref(false)
    const minting = ref(false)

    // --- CONTRACT ROLE ---
    const { isAdmin, approvedMintersKYC, loadingMintersKYC, fetchApprovedMintersKYC } = useKycRole()

    // --- FETCH MINTERS ---
    const fetchAllWalletsAsMinters = async () => {
      if (!wallets.value.length) return
      loadingMintersKYC.value = true
      try {
        await fetchApprovedMintersKYC(wallets.value.map((w) => w.address))
      } finally {
        loadingMintersKYC.value = false
      }
    }

    onMounted(async () => {
      await fetchWalletsFromUsers()
      if (wallets.value.length > 0) await fetchAllWalletsAsMinters()
    })

    // --- FILE HANDLER ---
    const onFileChange = (e: Event) => {
      const files = (e.target as HTMLInputElement).files
      selectedFile.value = files?.[0] ?? null
    }

    // --- QUICK CHECK NFT ---
    const checkNFT = async () => {
      if (!tokenId.value) return
      error.value = null
      success.value = null
      try {
        const kyc = await getKycById(tokenId.value.toString())
        if (!kyc) {
          nftInfo.value = null
          error.value = 'NFT not found in backend'
          return
        }
        nftInfo.value = kyc
      } catch (err: any) {
        console.error(err)
        error.value = err.message || 'Failed to fetch KYC'
      }
    }

    // --- MINTING ---
    const verifyAndMint = async () => {
      if (!selectedFile.value) return
      error.value = null
      success.value = null

      if (!account.value || !walletClient.value) {
        error.value = 'Wallet not connected'
        addToast('Wallet not connected', 'error')
        return
      }

      if (!approvedMintersKYC.value) {
        error.value = 'Wallet not authorized for minting'
        addToast('Wallet not authorized for minting', 'error')
        return
      }

      minting.value = true
      try {        
        const arrayBuffer = await selectedFile.value.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        const fileHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        const existingId = await getTokenIdByHash(fileHash)
        if (existingId && existingId !== 0n) {
          tokenId.value = existingId
          error.value = `Document already minted! Token ID: ${existingId}`
          addToast(`Document already minted! Token ID: ${existingId}`, 'error')
          return
        }

        const metadataUrl = await uploadToLocal(selectedFile.value, account.value)
        const { tokenId: mintedId, txHash } = await mintDocument(account.value as `0x${string}`, selectedFile.value)
        tokenId.value = typeof mintedId === 'string' ? BigInt(mintedId) : mintedId
        
        await createKyc({
          file: selectedFile.value,
          tokenId: mintedId.toString(),
          owner: account.value,
          fileHash,
          metadataUrl,
          name: selectedFile.value.name,
          description: `Document minted by ${account.value}`,
          txHash,
          action: 'mintKYC',
          executor: account.value,
          createdAt: Date.now(),
        })

        success.value = `Document minted and saved! Token ID: ${mintedId}`
        window.dispatchEvent(new Event('kyc-minted'))
        addToast(`Document minted and saved! Token ID: ${mintedId}`, 'success')
      } catch (err: any) {
        console.error(err)
        error.value = err.message || 'Minting failed'
        addToast('KYC', 'error', err.message || 'Minting failed')
      } finally {
        minting.value = false
      }
    }

    // --- LIFECYCLE ACTIONS ---
    const handleReview = async () => {
      if (!tokenId.value) return
      processing.value = true
      try {
        await reviewDocument(tokenId.value)
        success.value = `Document reviewed (Token ID: ${tokenId.value})`
        addToast(`Document reviewed (Token ID: ${tokenId.value})`, 'success')

        const updatedKyc = await getKycById(tokenId.value.toString())
        if (updatedKyc) nftInfo.value = updatedKyc
      } catch (err: any) {
        error.value = err.message || 'Review failed'
        addToast(err.message || 'Review failed', 'error')
      } finally {
        processing.value = false
      }
    }

    const handleSign = async () => {
      if (!tokenId.value) return
      processing.value = true
      try {
        await signDocument(tokenId.value)
        success.value = `Document signed (Token ID: ${tokenId.value})`
        addToast(`Document signed (Token ID: ${tokenId.value})`, 'success')

        const updatedKyc = await getKycById(tokenId.value.toString())
        if (updatedKyc) nftInfo.value = updatedKyc
      } catch (err: any) {
        error.value = err.message || 'Sign failed'
        addToast(err.message || 'Sign failed', 'error')
      } finally {
        processing.value = false
      }
    }

    const handleRevoke = async () => {
      if (!tokenId.value) return
      processing.value = true
      try {
        await revokeDocument(tokenId.value)
        success.value = `Document revoked (Token ID: ${tokenId.value})`
        addToast(`Document revoked (Token ID: ${tokenId.value})`, 'success')

        const updatedKyc = await getKycById(tokenId.value.toString())
        if (updatedKyc) nftInfo.value = updatedKyc
      } catch (err: any) {
        error.value = err.message || 'Revoke failed'
        addToast(err.message || 'Revoke failed', 'error')
      } finally {
        processing.value = false
      }
    }

    // --- MINTER MANAGEMENT ---
    const handleAddMinter = async () => {
      if (!minterAddress.value || !isAdmin.value) return
      addingMinter.value = true
      error.value = null
      success.value = null

      try {
        const alreadyExists = approvedMintersKYC.value.some(
          (addr) => addr.toLowerCase() === minterAddress.value.toLowerCase()
        )
        if (alreadyExists) {
          error.value = `Address ${minterAddress.value} is already an approved minter`
          addToast(error.value, 'error')
          return
        }

        await addMinter(minterAddress.value as `0x${string}`)
        success.value = `Minter added: ${minterAddress.value}`
        addToast(success.value, 'success')

        const updatedList = [...wallets.value.map((w) => w.address as `0x${string}`)]
        minterAddress.value = ''
        await fetchApprovedMintersKYC(updatedList)
      } catch (err: any) {
        error.value = err.message || 'Add minter failed'
        addToast(err.message || 'Add minter failed', 'error')
      } finally {
        addingMinter.value = false
      }
    }

    const handleRemoveMinter = async () => {
      if (!minterAddress.value || !isAdmin.value) return
      removingMinter.value = true
      error.value = null
      success.value = null

      try {
        const exists = approvedMintersKYC.value.some(
          (addr) => addr.toLowerCase() === minterAddress.value.toLowerCase()
        )
        if (!exists) {
          error.value = `Address ${minterAddress.value} is not in the approved minters list`
          addToast(error.value, 'error')
          return
        }

        await removeMinter(minterAddress.value as `0x${string}`)
        success.value = `Minter removed: ${minterAddress.value}`
        addToast(success.value, 'success')

        const updatedList = wallets.value.map((w) => w.address as `0x${string}`)
        await fetchApprovedMintersKYC(updatedList)
        minterAddress.value = ''
      } catch (err: any) {
        error.value = err.message || 'Remove minter failed'
        addToast(err.message || 'Remove minter failed', 'error')
      } finally {
        removingMinter.value = false
      }
    }

    return {
      // WALLET
      walletClient,
      account,

      // FILE MINTING
      selectedFile,
      onFileChange,
      verifyAndMint,
      minting,

      // NFT CHECK
      tokenId,
      nftInfo,
      checkNFT,

      // LIFECYCLE
      processing,
      handleReview,
      handleSign,
      handleRevoke,

      // MINTER MANAGEMENT
      minterAddress,
      addingMinter,
      removingMinter,
      handleAddMinter,
      handleRemoveMinter,

      // CONTRACT ROLE
      isAdmin,
      approvedMintersKYC,
      loadingMintersKYC,
      fetchApprovedMintersKYC,

      // DASHBOARD
      wallets,
      fetchWalletsFromUsers,

      // FEEDBACK
      error,
      success,
      addToast,
    }
  }
