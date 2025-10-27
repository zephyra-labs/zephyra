import { createWalletClient, createPublicClient, http, type WalletClient } from 'viem'
import kycRegistryArtifact from '../../../../artifacts/contracts/KYCRegistry.sol/KYCRegistry.json' assert { type: 'json' }
import documentRegistryArtifact from '../../../../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json' assert { type: 'json' }
import factoryArtifact from '../../../../artifacts/contracts/TradeAgreementFactory.sol/TradeAgreementFactory.json' assert { type: 'json' }
import mockUSDCArtifact from '../../../../artifacts/contracts/MockUSDC.sol/MintableUSDC.json' assert { type: 'json' }

export const Chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}

export const kycRegistryAbi = kycRegistryArtifact.abi
export const documentRegistryAbi = documentRegistryArtifact.abi
export const factoryAbi = factoryArtifact.abi
export const mockUSDCAbi = mockUSDCArtifact.abi

export const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

// --- Wallet Helpers ---
export async function makeWallet(privKey: `0x${string}`): Promise<WalletClient> {
  return createWalletClient({
    account: privKey,
    chain: Chain,
    transport: http(Chain.rpcUrls.default.http[0]),
  })
}

export async function makeWalletImporter() { return makeWallet('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') }
export async function makeWalletExporter() { return makeWallet('0x70997970c51812dc3a010c7d01b50e0d17dc79c8') }
export async function makeWalletRandom() { return makeWallet('0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199') }

// --- Deploy Fixture Contracts ---
export async function deployFixtureContracts(walletClient: WalletClient) {
  // KYCRegistry
  const kycTxHash = await walletClient.deployContract({
    account: walletClient.account!.address,
    chain: Chain,
    abi: kycRegistryAbi,
    bytecode: kycRegistryArtifact.bytecode as `0x${string}`,
    args: [walletClient.account!.address],
  })
  const kycReceipt = await publicClient.waitForTransactionReceipt({ hash: kycTxHash })
  const kycRegistryAddress = kycReceipt.contractAddress!

  // TradeAgreementFactory
  const factoryTxHash = await walletClient.deployContract({
    account: walletClient.account!.address,
    chain: Chain,
    abi: factoryAbi,
    bytecode: factoryArtifact.bytecode as `0x${string}`,
    args: [kycRegistryAddress],
  })
  const factoryReceipt = await publicClient.waitForTransactionReceipt({ hash: factoryTxHash })
  const factoryAddress = factoryReceipt.contractAddress!

  // DocumentRegistry
  const documentTxHash = await walletClient.deployContract({
    account: walletClient.account!.address,
    chain: Chain,
    abi: documentRegistryAbi,
    bytecode: documentRegistryArtifact.bytecode as `0x${string}`,
    args: [walletClient.account!.address],
    gas: 5_000_000n,
  })
  const documentReceipt = await publicClient.waitForTransactionReceipt({ hash: documentTxHash })
  const documentRegistryAddress = documentReceipt.contractAddress!

  // MockUSDC
  const usdcTxHash = await walletClient.deployContract({
    account: walletClient.account!.address,
    chain: Chain,
    abi: mockUSDCAbi,
    bytecode: mockUSDCArtifact.bytecode as `0x${string}`,
  })
  const usdcReceipt = await publicClient.waitForTransactionReceipt({ hash: usdcTxHash })
  const mockUSDCAddress = usdcReceipt.contractAddress!

  return { kycRegistryAddress, factoryAddress, documentRegistryAddress, mockUSDCAddress }
}

export async function mintUSDC(
  walletClient: WalletClient,
  tokenAddress: `0x${string}`,
  to: `0x${string}`,
  amount: bigint
) {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address,
    chain: Chain,
    address: tokenAddress,
    abi: mockUSDCAbi,
    functionName: 'mint',
    args: [to, amount],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

export function parseViemError(error: any): { reason?: string } {
  if (!error) return {}
  if (typeof error.shortMessage === 'string') return { reason: error.shortMessage }
  if (error.cause && typeof error.cause.reason === 'string') return { reason: error.cause.reason }
  return { reason: error.message }
}