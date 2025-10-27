import { ref } from 'vue'
import { createPublicClient, http, decodeEventLog } from 'viem'
import registryKYCArtifact from '../../../artifacts/contracts/KYCRegistry.sol/KYCRegistry.json'
import { Chain } from '../config/chain'
import { useWallet } from '~/composables/useWallets'
import { useActivityLogs } from '~/composables/useActivityLogs'
import { useKYC } from './useKycs'
import type { MintResult } from '~/types/Mint'
import type { KYCStatus } from '~/types/Kyc'

const registryAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3' as const
const { abi } = registryKYCArtifact

const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

export function useRegistryKYC() {
  const { account, walletClient } = useWallet()
  const { updateKyc } = useKYC()
  const { addActivityLog } = useActivityLogs()

  const loading = ref(false)

  // ---------------- Helpers ----------------
  async function getTokenIdByHash(fileHash: string): Promise<bigint> {
    try {
      return (await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: 'getTokenIdByHash',
        args: [fileHash],
      })) as bigint
    } catch (err) {
      console.error('[getTokenIdByHash] Failed:', err)
      return 0n
    }
  }

  async function getStatus(tokenId: bigint): Promise<number | null> {
    try {
      return (await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: 'getStatus',
        args: [tokenId],
      })) as number
    } catch (err) {
      console.error('[getStatus] Failed:', err)
      return null
    }
  }

  async function quickCheckNFT(tokenId: bigint) {
    try {
      const owner = await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: 'ownerOf',
        args: [tokenId],
      })
      const tokenURI = await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: 'tokenURI',
        args: [tokenId],
      })
      return { owner, metadata: tokenURI }
    } catch (err) {
      console.error('[quickCheckNFT] Failed:', err)
      return null
    }
  }

  async function isMinter(addr: `0x${string}`): Promise<boolean> {
    try {
      return (await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: 'isMinter',
        args: [addr],
      })) as boolean
    } catch (err) {
      console.error('[isMinter] Failed:', err)
      return false
    }
  }

  // ---------------- Generic executor ----------------
  /**
   * Execute on-chain function and optionally sync to backend via updateKyc.
   *
   * @param action - logical action name for logs (e.g. 'mintKYC', 'reviewKYC')
   * @param fnName - contract function name to call
   * @param args - function args
   * @param updatePayload - payload to pass to backend update (partial KYC fields)
   * @param status - optional KYC status to persist (default 'confirmed')
   * @param skipBackend - skip backend sync if true
   */
  async function executeAction(
    action: string,
    fnName: string,
    args: any[] = [],
    updatePayload: Record<string, any> = {},
    status?: KYCStatus,
    skipBackend = false
  ) {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    loading.value = true
    try {
      console.debug(`[executeAction] Sending tx for action ${action}, fnName ${fnName}`, args)

      const txHash = await walletClient.value.writeContract({
        address: registryAddress,
        abi,
        functionName: fnName,
        args,
        account: account.value as `0x${string}`,
        chain: Chain,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // decode tokenId if any
      let tokenId: bigint | undefined
      let tokenIdStr: string | undefined
      const eventLog = receipt.logs.find(log => log.address === registryAddress)
      if (eventLog) {
        try {
          const decoded = decodeEventLog({
            abi,
            data: eventLog.data,
            topics: eventLog.topics,
          }) as any
          if (decoded?.args?.tokenId) {
            tokenId = BigInt(decoded.args.tokenId)
            tokenIdStr = String(decoded.args.tokenId)
          }
        } catch (err) {
          console.warn('[executeAction] Failed to decode event log:', err)
        }
      }

      // --- add onchain activity log ---
      await addActivityLog(account.value as string, {
        type: 'onChain',
        action,
        txHash,
        contractAddress: registryAddress,
        extra: { fnName, args, tokenId: tokenIdStr },
        tags: ['kyc', 'onchain', action],
      })

      // --- backend sync ---
      if (tokenIdStr && !skipBackend) {
        // send both executor and account for clarity (executor = who executed, account = owner if needed)
        await updateKyc({
          tokenId: tokenIdStr,
          payload: updatePayload,
          action,
          txHash,
          executor: account.value as string,
          account: account.value as string,
          status,
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
  async function mintDocument(to: `0x${string}`, file: File): Promise<MintResult> {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const fileHash = '0x' + Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const imageUrl = 'https://res.cloudinary.com/ajaxtreon/image/upload/v1756638229/hueegaotkhngaoof6edu.png'
      const metadata = {
        name: file.name,
        description: `Verified document ${file.name}`,
        image: imageUrl,
        attributes: [{ trait_type: 'Hash', value: fileHash }],
      }
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`

      const { receipt, txHash, tokenId } = await executeAction(
        'mintKYC',
        'verifyAndMint',
        [to, fileHash, tokenURI],
        {
          owner: to,
          fileHash,
          metadataUrl: tokenURI,
          name: file.name,
          description: metadata.description,
        },
        'Draft',
        true
      )
      if (!tokenId) throw new Error('Mint failed, no tokenId returned')

      return { receipt, tokenId: tokenId?.toString(), metadataUrl: tokenURI, fileHash, txHash }
    } catch (err) {
      console.error('[mintDocument] error:', err)
      throw err
    }
  }

  const reviewDocument = (tokenId: bigint) =>
    executeAction('reviewKYC', 'reviewDocument', [tokenId], {}, 'Reviewed', false)

  const signDocument = (tokenId: bigint) =>
    executeAction('signKYC', 'signDocument', [tokenId], {}, 'Signed', false)

  const revokeDocument = (tokenId: bigint) =>
    executeAction('revokeKYC', 'revokeDocument', [tokenId], {}, 'Revoked', false)

  const addMinter = (newMinter: `0x${string}`) =>
    executeAction('addMinter', 'addMinter', [newMinter])

  const removeMinter = (minter: `0x${string}`) =>
    executeAction('removeMinter', 'removeMinter', [minter])

  return {
    mintDocument,
    reviewDocument,
    signDocument,
    revokeDocument,
    addMinter,
    removeMinter,
    getTokenIdByHash,
    getStatus,
    quickCheckNFT,
    isMinter,
    loading,
  }
}
