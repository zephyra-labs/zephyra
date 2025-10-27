import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// --- Fix __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Load artifact
const artifactPath = path.resolve(
  __dirname,
  '../artifacts/contracts/TradeAgreementFactory.sol/TradeAgreementFactory.json'
)
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'))

// --- Setup chain
const chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}

// --- Public & Wallet clients
const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })
const walletClient = createWalletClient({
  chain,
  transport: http(chain.rpcUrls.default.http[0]),
  account: privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  ),
})

// --- Registry address (bisa deploy KYCRegistry dulu manual atau di script lain)
const registryAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3'

// --- Deploy factory
async function deployFactory() {
  const deployer = walletClient.account.address
  console.log('Deploying TradeAgreementFactory from:', deployer)

  const txHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: `0x${artifact.bytecode.replace(/^0x/, '')}` as `0x${string}`,
    account: deployer,
    args: [registryAddress],
    gas: 5_000_000n,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log('Factory deployed at:', receipt.contractAddress)
  return receipt.contractAddress
}

deployFactory().catch(console.error)
