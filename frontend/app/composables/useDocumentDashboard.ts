import { ref, computed, watch, onMounted } from 'vue'
import { useWallet } from '~/composables/useWallets'
import { useDocuments } from '~/composables/useDocuments'
import { useRegistryDocument } from '~/composables/useRegistryDocument'
import { useContractActions } from '~/composables/useContractActions'
import { useDashboard } from '~/composables/useDashboard'
import { useToast } from '~/composables/useToast'
import { useContractRole } from '~/composables/useContractRole'
import type { Document as DocType } from '~/types/Document'

export function useDocumentDashboard(initialContract: string | null = null) {
  // --- Composables ---
  const { addToast } = useToast()
  const { account } = useWallet()
  const { attachDocument, getDocumentsByContract } = useDocuments()
  const { mintDocument, addMinter, removeMinter, reviewDocument, signDocument, revokeDocument } = useRegistryDocument()
  const { deployedContracts, fetchDeployedContracts } = useContractActions()
  const { wallets, fetchWalletsFromUsers } = useDashboard()

  // --- State ---
  const currentContract = ref<string | null>(initialContract)
  const documents = ref<DocType[]>([])
  const selectedFiles = ref<File[]>([])
  const fileProgresses = ref<{ file: File; progress: number; status: string; tokenId?: number }[]>([])
  const docType = ref<'Invoice' | 'B/L' | 'COO' | 'PackingList' | 'Other'>('Invoice')

  const minting = ref(false)
  const minterAddress = ref<string>('')
  const addingMinter = ref(false)
  const removingMinter = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  const showViewer = ref(false)
  const selectedDocSrc = ref<string | null>(null)
  const selectedDoc = ref<DocType | null>(null)
  const loadingDocs = ref(false)

  // --- Contract Roles ---
  const { 
    isAdmin, 
    isImporter, 
    isExporter, 
    userRole, 
    approvedMintersDoc, 
    loadingMintersDoc, 
    fetchApprovedMintersDoc 
  } = useContractRole(currentContract)

  // --- Computed ---
  const canAttachAndMint = computed(() => {
    return currentContract.value && account.value && (isImporter.value || isExporter.value)
  })
  
  const userIsMinter = computed(() => {
    if (!account.value) return false
    return approvedMintersDoc.value.some(addr => addr.toLowerCase() === account.value!.toLowerCase())
  })

  // --- Methods ---
  const fetchDocuments = async () => {
    if (!currentContract.value) return
    loadingDocs.value = true
    try {
      documents.value = await getDocumentsByContract(currentContract.value)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch documents'
      addToast(error.value || 'Failed to fetch documents', 'error')
    } finally {
      loadingDocs.value = false
    }
  }
  
  const fetchApprovedMinters = async () => {
    if (!wallets.value?.length) return
    const addresses = wallets.value.map(w => w.address as `0x${string}`)
    if (addresses.length === 0) return

    await fetchApprovedMintersDoc(addresses)
  }

  const handleAttachAndMint = async () => {
    if (!selectedFiles.value.length || !currentContract.value || !account.value) {
      error.value = 'Select files, connect wallet, and choose a contract'
      addToast(error.value, 'error')
      return
    }
    if (!userRole.value) {
      error.value = 'You are not authorized for this contract'
      addToast(error.value, 'error')
      return
    }

    minting.value = true
    fileProgresses.value = selectedFiles.value.map(f => ({ file: f, progress: 0, status: 'pending' }))

    for (let i = 0; i < selectedFiles.value.length; i++) {
      const fp = fileProgresses.value[i]
      if (!fp) continue
      try {
        fp.status = 'minting'
        fp.progress = 10

        const { tokenId, metadataUrl, fileHash, txHash } = await mintDocument(account.value as `0x${string}`, fp.file, docType.value)
        fp.progress = 50
        fp.status = 'uploading'

        const uploadedDoc = await attachDocument(currentContract.value, {
          tokenId: Number(tokenId),
          owner: account.value,
          fileHash,
          uri: `uploaded://fake-url/${fp.file.name}`,
          docType: docType.value,
          linkedContracts: [currentContract.value],
          createdAt: Date.now(),
          signer: account.value,
          name: fp.file.name,
          description: `Attached & minted document ${fp.file.name}`,
          metadataUrl,
        }, account.value, txHash)

        documents.value.push(uploadedDoc)
        fp.progress = 100
        fp.status = 'success'
        fp.tokenId = Number(tokenId)
        success.value = `Document minted & attached: ${fp.file.name}`
        addToast(success.value, 'success')
      } catch (err: any) {
        console.error(err)
        fp.progress = 100
        fp.status = 'error'
        error.value = err.message || `Failed to mint ${fp.file.name}`
        addToast(error.value || `Failed to mint ${fp.file.name}`, 'error')
      }
    }

    selectedFiles.value = []
    minting.value = false
  }

  const handleAddMinter = async () => {
    if (!minterAddress.value || !isAdmin.value) return
    addingMinter.value = true
    try {
      await addMinter(minterAddress.value as `0x${string}`)
      addToast(`Minter added: ${minterAddress.value}`, 'success')
      minterAddress.value = ''
      await fetchApprovedMintersDoc(wallets.value.map(w => w.address as `0x${string}`))
    } finally { addingMinter.value = false }
  }

  const handleRemoveMinter = async () => {
    if (!minterAddress.value || !isAdmin.value) return
    removingMinter.value = true
    try {
      await removeMinter(minterAddress.value as `0x${string}`)
      addToast(`Minter removed: ${minterAddress.value}`, 'success')
      minterAddress.value = ''
      await fetchApprovedMintersDoc(wallets.value.map(w => w.address as `0x${string}`))
    } finally { removingMinter.value = false }
  }

  const handleReview = async (doc: DocType) => {
    if (!account.value || !doc.tokenId) return
    try {
      await reviewDocument(BigInt(doc.tokenId))
      doc.status = 'Reviewed'
      addToast(`Document ${doc.name} marked Reviewed`, 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to review document', 'error')
    }
  }

  const handleSign = async (doc: DocType) => {
    if (!account.value || !doc.tokenId) return
    try {
      await signDocument(BigInt(doc.tokenId))
      doc.status = 'Signed'
      addToast(`Document ${doc.name} signed`, 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to sign document', 'error')
    }
  }

  const handleRevoke = async (doc: DocType) => {
    if (!account.value || !doc.tokenId) return
    try {
      await revokeDocument(BigInt(doc.tokenId))
      doc.status = 'Revoked'
      addToast(`Document ${doc.name} revoked`, 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke document', 'error')
    }
  }

  const openViewer = (doc: DocType) => {
    selectedDoc.value = doc
    selectedDocSrc.value = doc.uri
    showViewer.value = true
  }

  // --- Lifecycle ---
  onMounted(async () => {
    await fetchWalletsFromUsers()
    await fetchDeployedContracts()
    await fetchApprovedMinters()
    await fetchDocuments()
  })

  // watchers
  watch([currentContract, account], async ([contract, acc]) => {
    if (!contract || !acc) {
      documents.value = []
      return
    }
    await fetchApprovedMinters()
    await fetchDocuments()
  })

  return {
    // state
    account,
    currentContract,
    documents,
    selectedFiles,
    fileProgresses,
    docType,
    userRole,
    isAdmin,
    isImporter,
    isExporter,
    userIsMinter,
    approvedMintersDoc,
    loadingDocs,
    loadingMintersDoc,
    minting,
    minterAddress,
    addingMinter,
    removingMinter,
    error,
    success,
    deployedContracts,
    // viewer
    selectedDoc,
    selectedDocSrc,
    showViewer,
    // methods
    fetchDocuments,
    fetchApprovedMinters,
    fetchApprovedMintersDoc,
    handleAttachAndMint,
    handleAddMinter,
    handleRemoveMinter,
    handleReview,
    handleSign,
    handleRevoke,
    openViewer,
    canAttachAndMint
  }
}
