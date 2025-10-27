import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  createWalletClient,
  createPublicClient,
  http,
  type Chain,
  type Address,
  type Abi,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// --- Fix __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Setup local Hardhat chain
const chain: Chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}

// --- Clients
const transport = http(chain.rpcUrls.default.http[0])
const publicClient = createPublicClient({ chain, transport })
const walletClient = createWalletClient({
  chain,
  transport,
  account: privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  ),
})

// --- Helper to load artifacts
function loadArtifact(name: string, fileName: string = name): {
  abi: Abi
  bytecode: string
} {
  const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${fileName}.json`)
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'))
  return { abi: artifact.abi as Abi, bytecode: artifact.bytecode as string }
}

// --- Deploy helper
async function deployContract(
  abi: Abi,
  bytecode: string,
  args: readonly unknown[] = []
): Promise<Address> {
  const deployer = walletClient.account.address
  const txHash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode.replace(/^0x/, '')}` as Hex,
    account: deployer,
    args,
    gas: 5_000_000n,
  })
  console.log(`⏳ Transaction sent: ${txHash}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log(`✅ Deployed at: ${receipt.contractAddress}\n`)
  return receipt.contractAddress as Address
}

// --- Deploy sequence
async function main() {
  console.log('🚀 Starting full deployment...')
  const deployer = walletClient.account.address
  console.log('Using deployer:', deployer)
  console.log('------------------------------------\n')

  // 1️⃣ Deploy KYCRegistry
  console.log('Deploying KYCRegistry...')
  const { abi: kycAbi, bytecode: kycBytecode } = loadArtifact('KYCRegistry')
  const kycRegistry = await deployContract(kycAbi, kycBytecode, [deployer])

  // 2️⃣ Deploy TradeAgreementFactory
  console.log('Deploying TradeAgreementFactory...')
  const { abi: factoryAbi, bytecode: factoryBytecode } = loadArtifact('TradeAgreementFactory')
  const tradeFactory = await deployContract(factoryAbi, factoryBytecode, [kycRegistry])
  
  // 3️⃣ Deploy DocumentRegistry
  console.log('Deploying DocumentRegistry...')
  const { abi: docAbi, bytecode: docBytecode } = loadArtifact('DocumentRegistry')
  const documentRegistry = await deployContract(docAbi, docBytecode, [deployer])

  // 4️⃣ Deploy MockUSDC
  console.log('Deploying MockUSDC...')
  const { abi: usdcRawAbi, bytecode: usdcBytecode } = loadArtifact('MockUSDC', 'MintableUSDC')
  const constructorAbi = {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ internalType: 'uint256', name: 'initialSupply', type: 'uint256' }],
  } as const
  const usdcAbi: Abi = [constructorAbi, ...usdcRawAbi]
  const mockUSDC = await deployContract(usdcAbi, usdcBytecode, [1_000_000n * 10n ** 6n])

  // ✅ Summary
  console.log('------------------------------------')
  console.log('🎉 Deployment complete!')
  console.log('KYCRegistry:          ', kycRegistry)
  console.log('TradeAgreementFactory:', tradeFactory)
  console.log('DocumentRegistry:     ', documentRegistry)
  console.log('MockUSDC:             ', mockUSDC)
}

main().catch((err) => {
  console.error('❌ Deployment failed:', err)
  process.exit(1)
})
