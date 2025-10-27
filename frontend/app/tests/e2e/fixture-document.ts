import { publicClient, documentRegistryAbi, Chain } from './fixture-chain'
import type { WalletClient } from 'viem'
import { parseEventLogs } from 'viem'

// --- Minter Management ---
export async function addMinterDocument(
  walletClient: WalletClient,
  documentRegistryAddress: `0x${string}`,
  minter: `0x${string}`
) {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: documentRegistryAddress,
    abi: documentRegistryAbi,
    functionName: 'addMinter',
    args: [minter],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Mint & Verify ---
export async function verifyAndMintDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  to: `0x${string}`,
  fileHash: string,
  tokenURI: string,
  docType: string
): Promise<bigint> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'verifyAndMint',
    args: [to, fileHash, tokenURI, docType],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  const logs = parseEventLogs({
    abi: documentRegistryAbi,
    logs: receipt.logs,
    eventName: 'DocumentVerified',
  }) as unknown as Array<{ args: { tokenId: bigint } }>

  if (!logs[0]?.args?.tokenId) throw new Error('Document not minted')
  return logs[0].args.tokenId
}

// --- Review ---
export async function reviewDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'reviewDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Sign ---
export async function signDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'signDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Link ---
export async function linkDocumentToContract(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  contractAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'linkDocumentToContract',
    args: [contractAddress, tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Revoke ---
export async function revokeDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'revokeDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Getters ---
export async function getTokenIdByHash(fileHash: string, registryAddress: `0x${string}`): Promise<bigint> {
  return await publicClient.readContract({
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'getTokenIdByHash',
    args: [fileHash],
  }) as bigint
}

export async function getDocType(tokenId: bigint, registryAddress: `0x${string}`): Promise<string> {
  return await publicClient.readContract({
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'getDocType',
    args: [tokenId],
  }) as string
}

export async function getStatus(registryAddress: `0x${string}`, tokenId: bigint): Promise<number> {
  return await publicClient.readContract({
    address: registryAddress,
    abi: documentRegistryAbi,
    functionName: 'getStatus',
    args: [tokenId],
  }) as number
}

// --- Combined Helper: Mint & Link ---
export async function mintAndLinkDocument(
  walletClient: WalletClient,
  documentRegistryAddress: `0x${string}`,
  owner: `0x${string}`,
  tradeAgreementAddress: `0x${string}`,
  fileHash: string,
  tokenURI: string,
  docType: string
): Promise<{ txHashMint: `0x${string}`; tokenId: bigint; txHashLink: `0x${string}` }> {
  const isMinter = await publicClient.readContract({
    address: documentRegistryAddress,
    abi: documentRegistryAbi,
    functionName: 'isMinter',
    args: [owner],
  })
  if (!isMinter) throw new Error('Recipient not approved in Document Registry')

  const txHashMint = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: documentRegistryAddress,
    abi: documentRegistryAbi,
    functionName: 'verifyAndMint',
    args: [owner, fileHash, tokenURI, docType],
  })
  const receiptMint = await publicClient.waitForTransactionReceipt({ hash: txHashMint })
  if (!receiptMint.status) throw new Error('Minting document failed')

  const tokenId = await getTokenIdByHash(fileHash, documentRegistryAddress)

  const txHashLink = await linkDocumentToContract(walletClient, documentRegistryAddress, tradeAgreementAddress, tokenId)

  return { txHashMint, tokenId, txHashLink }
}
