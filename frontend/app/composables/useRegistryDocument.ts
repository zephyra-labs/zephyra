import { ref } from 'vue'
import { createPublicClient, http, decodeEventLog } from 'viem'
import documentRegistryArtifact from '../../../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json'
import { Chain } from '../config/chain'
import { useWallet } from '~/composables/useWallets'
import { useActivityLogs } from '~/composables/useActivityLogs'
import { useDocuments } from './useDocuments'
import { useStorage } from '~/composables/useStorage'
import type { MintResult } from '~/types/Mint'
import type { DocumentStatus } from '~/types/Document'

const { abi } = documentRegistryArtifact
const documentRegistryAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0' as `0x${string}`

const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

export function useRegistryDocument() {
  const { account, walletClient } = useWallet()
  const { addActivityLog } = useActivityLogs()
  const { updateDocument } = useDocuments()
  const { uploadToLocal } = useStorage()

  const loading = ref(false)
  const minting = ref(false)

  // ---------------- Generic executor ----------------
  async function executeAction(
    action: string,
    fnName: string,
    args: any[] = [],
    updatePayload: Record<string, any> = {},
    status?: DocumentStatus,
    skipBackend = false,
  ) {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    loading.value = true
    try {
      console.debug(`[executeAction] Sending tx for ${action} → ${fnName}`, args)

      const txHash = await walletClient.value.writeContract({
        address: documentRegistryAddress,
        abi,
        functionName: fnName,
        args,
        account: account.value as `0x${string}`,
        chain: Chain,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // decode tokenId jika ada
      let tokenId: string | undefined
      const eventLog = receipt.logs.find(log => log.address === documentRegistryAddress)
      if (eventLog) {
        try {
          const decoded = decodeEventLog({ abi, data: eventLog.data, topics: eventLog.topics }) as any
          if (decoded.args?.tokenId) {
            tokenId = String(decoded.args.tokenId)
          }
        } catch (err) {
          console.warn('[executeAction] Failed to decode event log:', err)
        }
      }

      // --- add onchain activity log ---
      await addActivityLog(account.value, {
        type: 'onChain',
        action,
        txHash,
        contractAddress: documentRegistryAddress,
        extra: { fnName, args, tokenId, ...updatePayload },
        tags: ['Document', action],
      })
      
      if (tokenId && !skipBackend) {
        await updateDocument({
          tokenId: Number(tokenId),
          payload: updatePayload,
          account: account.value,
          txHash,
          action,
          status: status,
        })
      }

      loading.value = false
      return { receipt, txHash, tokenId }
    } catch (err) {
      loading.value = false
      console.error(`[executeAction] ${action} error:`, err)
      throw err
    }
  }

  // ---------------- Core Actions ----------------
  async function mintDocument(to: `0x${string}`, file: File, docType: string): Promise<MintResult> {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    minting.value = true
    try {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const fileHash = '0x' + Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      // metadata → upload
      const metadata = {
        name: file.name,
        description: `Verified document ${file.name}`,
        attributes: [
          { trait_type: 'Hash', value: fileHash },
          { trait_type: 'DocType', value: docType },
        ],
      }
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      const metadataFile = new File([metadataBlob], `${file.name}.json`, { type: 'application/json' })
      const metadataUrl = await uploadToLocal(metadataFile, account.value)

      const { receipt, txHash, tokenId } = await executeAction(
        'mintDocument',
        'verifyAndMint',
        [to, fileHash, metadataUrl, docType],
        { fileName: file.name, fileHash, docType, metadataUrl },
        'Draft',
        true
      )

      minting.value = false
      return { receipt, tokenId: tokenId!, metadataUrl, fileHash, txHash }
    } catch (err) {
      minting.value = false
      console.error('[mintDocument] error:', err)
      throw err
    }
  }

  const reviewDocument = (tokenId: bigint) =>
    executeAction('reviewDocument', 'reviewDocument', [tokenId], { status: 'Reviewed' }, 'Reviewed')

  const signDocument = (tokenId: bigint) =>
    executeAction('signDocument', 'signDocument', [tokenId], { status: 'Signed' }, 'Signed')

  const revokeDocument = (tokenId: bigint) =>
    executeAction('revokeDocument', 'revokeDocument', [tokenId], { status: 'Revoked' }, 'Revoked')

  const linkDocumentToContract = (contractAddress: `0x${string}`, tokenId: bigint) =>
    executeAction('linkDocument', 'linkDocumentToContract', [contractAddress, tokenId], { linkedTo: contractAddress })

  const addMinter = (newMinter: `0x${string}`) =>
    executeAction('addMinter', 'addMinter', [newMinter], { newMinter })

  const removeMinter = (minter: `0x${string}`) =>
    executeAction('removeMinter', 'removeMinter', [minter], { minter })

  // ---------------- Read Helpers ----------------
  const getTokenIdByHash = async (fileHash: string) => {
    try {
      return await publicClient.readContract({
        address: documentRegistryAddress,
        abi,
        functionName: 'getTokenIdByHash',
        args: [fileHash],
      }) as bigint
    } catch (err) {
      console.error('[getTokenIdByHash] Failed:', err)
      return 0n
    }
  }

  const getStatus = async (tokenId: bigint) => {
    try {
      return await publicClient.readContract({
        address: documentRegistryAddress,
        abi,
        functionName: 'getStatus',
        args: [tokenId],
      }) as number
    } catch (err) {
      console.error('[getStatus] Failed:', err)
      return null
    }
  }

  const isMinter = async (addr: `0x${string}`): Promise<boolean> => {
    try {
      return await publicClient.readContract({
        address: documentRegistryAddress,
        abi,
        functionName: 'isMinter',
        args: [addr],
      }) as boolean
    } catch (err) {
      console.error('[isMinter] Failed:', err)
      return false
    }
  }

  const quickCheckNFT = async (tokenId: bigint) => {
    try {
      const owner = await publicClient.readContract({ address: documentRegistryAddress, abi, functionName: 'ownerOf', args: [tokenId] })
      const tokenURI = await publicClient.readContract({ address: documentRegistryAddress, abi, functionName: 'tokenURI', args: [tokenId] })
      const docType = await publicClient.readContract({ address: documentRegistryAddress, abi, functionName: 'getDocType', args: [tokenId] })
      const status = await getStatus(tokenId)
      return { owner, metadata: tokenURI, docType, status }
    } catch (err) {
      console.error('[quickCheckNFT] Failed:', err)
      return null
    }
  }

  return {
    mintDocument,
    reviewDocument,
    signDocument,
    revokeDocument,
    linkDocumentToContract,
    addMinter,
    removeMinter,
    getTokenIdByHash,
    getStatus,
    isMinter,
    quickCheckNFT,
    loading,
    minting,
  }
}
