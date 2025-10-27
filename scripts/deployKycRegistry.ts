import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// --- Fix __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Load KYCRegistry artifact
const artifactPath = path.resolve(
  __dirname,
  '../artifacts/contracts/KYCRegistry.sol/KYCRegistry.json'
)
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'))
const { abi, bytecode } = artifact

// --- Setup local Hardhat chain
const chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}

// --- Public & Wallet clients
const publicClient = createPublicClient({
  chain,
  transport: http(chain.rpcUrls.default.http[0]),
})

const walletClient = createWalletClient({
  chain,
  transport: http(chain.rpcUrls.default.http[0]),
  account: privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Hardhat default account 1
  ),
})

// --- Deploy KYCRegistry
async function deployKycRegistry() {
  try {
    const deployer = walletClient.account.address
    console.log('Deploying KYCRegistry from:', deployer)

    const txHash = await walletClient.deployContract({
      abi,
      bytecode: `0x${bytecode.replace(/^0x/, '')}` as `0x${string}`,
      account: deployer,
      args: [deployer], // initialOwner
      gas: 5_000_000n,
    })

    console.log('Transaction hash:', txHash)

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    console.log('KYCRegistry deployed at:', receipt.contractAddress)
    return receipt.contractAddress
  } catch (err) {
    console.error('Deploy error:', err)
    throw err
  }
}

deployKycRegistry()
