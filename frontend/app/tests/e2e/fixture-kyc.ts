import { publicClient, kycRegistryAbi, Chain } from './fixture-chain'
import type { WalletClient } from 'viem'

// --- Minter Management ---
export async function addMinterKYC(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  minter: `0x${string}`
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'addMinter',
    args: [minter],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Mint KYC Document ---
export async function mintKYC(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  to: `0x${string}`,
  fileHash: string,
  metadataUrl: string
): Promise<`0x${string}`> {
  // Pastikan minter sudah approved
  const isMinter = await publicClient.readContract({
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'isMinter',
    args: [walletClient.account!.address as `0x${string}`],
  })
  if (!isMinter) throw new Error('Sender is not approved as minter')

  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'verifyAndMint',
    args: [to, fileHash, metadataUrl],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Review Document ---
export async function reviewDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'reviewDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Sign Document ---
export async function signDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'signDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Revoke Document ---
export async function revokeDocument(
  walletClient: WalletClient,
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: Chain,
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'revokeDocument',
    args: [tokenId],
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

// --- Getters ---
export async function getTokenIdByHash(
  fileHash: string,
  registryAddress: `0x${string}`
): Promise<bigint> {
  return (await publicClient.readContract({
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'getTokenIdByHash',
    args: [fileHash],
  })) as bigint
}

export async function getStatus(
  registryAddress: `0x${string}`,
  tokenId: bigint
): Promise<number> {
  return (await publicClient.readContract({
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'getStatus',
    args: [tokenId],
  })) as number
}

export async function isMinter(
  registryAddress: `0x${string}`,
  addr: `0x${string}`
): Promise<boolean> {
  return (await publicClient.readContract({
    address: registryAddress,
    abi: kycRegistryAbi,
    functionName: 'isMinter',
    args: [addr],
  })) as boolean
}
