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
  '../artifacts/contracts/MockUSDC.sol/MintableUSDC.json'
)
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'))
const { abi: rawAbi, bytecode } = artifact

// --- Ensure constructor is present in ABI
const constructorAbi = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [{ internalType: 'uint256', name: 'initialSupply', type: 'uint256' }],
}
const abi = [constructorAbi, ...rawAbi] // prepend constructor

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

// --- Deploy MockUSDC
async function deployMockUSDC(initialSupply = 1_000_000n * 10n ** 6n) {
  const deployer = walletClient.account.address
  console.log('Deploying MockUSDC from:', deployer)

  const txHash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode.replace(/^0x/, '')}` as `0x${string}`,
    account: deployer,
    args: [initialSupply],
    gas: 3_000_000n,
  })

  console.log('Transaction hash:', txHash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log('MockUSDC deployed at:', receipt.contractAddress)
  return receipt.contractAddress
}

deployMockUSDC()
