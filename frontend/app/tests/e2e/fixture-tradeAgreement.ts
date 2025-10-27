import { publicClient, factoryAbi, mockUSDCAbi } from './fixture-chain'
import type { WalletClient } from 'viem'
import { parseEventLogs } from 'viem'

// --- Deploy agreement ---
export async function deployAgreement(
  walletClient: WalletClient,
  factoryAddress: `0x${string}`,
  importer: `0x${string}`,
  exporter: `0x${string}`,
  requiredAmount: bigint,
  importerDocId: bigint,
  exporterDocId: bigint,
  token: `0x${string}`
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address as `0x${string}`,
    chain: walletClient.chain,
    address: factoryAddress,
    abi: factoryAbi,
    functionName: 'deployTradeAgreement',
    args: [importer, exporter, requiredAmount, importerDocId, exporterDocId, token],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  const logs = parseEventLogs({
    abi: factoryAbi,
    logs: receipt.logs,
    eventName: 'ContractDeployed',
  }) as unknown as Array<{ args: { contractAddress: `0x${string}` } }>

  if (!logs[0]?.args?.contractAddress) throw new Error('Agreement not deployed')
  return logs[0].args.contractAddress
}

// --- Signing ---
export async function signAgreement(walletClient: WalletClient, agreementAddress: `0x${string}`): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address,
    chain: walletClient.chain,
    address: agreementAddress,
    abi: [{ inputs: [], name: 'sign', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'sign',
    args: [],
  })
  return txHash
}

// --- Deposit ---
export async function depositAgreement(
  walletClient: WalletClient,
  agreementAddress: `0x${string}`,
  amount: bigint,
  token?: `0x${string}`
): Promise<`0x${string}`> {
  if (!token || token === '0x0000000000000000000000000000000000000000') {
    const txHash = await walletClient.writeContract({
      account: walletClient.account!.address,
      chain: walletClient.chain,
      address: agreementAddress,
      abi: [{ inputs: [{ name: '_amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' }],
      functionName: 'deposit',
      args: [amount],
      value: amount,
    })
    return txHash
  } else {
    // ERC20 approve
    const approveHash = await walletClient.writeContract({
      account: walletClient.account!.address,
      chain: walletClient.chain,
      address: token,
      abi: mockUSDCAbi,
      functionName: 'approve',
      args: [agreementAddress, amount],
    })
    await publicClient.waitForTransactionReceipt({ hash: approveHash })

    const txHash = await walletClient.writeContract({
      account: walletClient.account!.address,
      chain: walletClient.chain,
      address: agreementAddress,
      abi: [{ inputs: [{ name: '_amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
      functionName: 'deposit',
      args: [amount],
    })
    return txHash
  }
}

// --- Shipping ---
export async function startShipping(walletClient: WalletClient, agreementAddress: `0x${string}`): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address,
    chain: walletClient.chain,
    address: agreementAddress,
    abi: [{ inputs: [], name: 'startShipping', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'startShipping',
    args: [],
  })
  return txHash
}

// --- Completion ---
export async function completeAgreement(walletClient: WalletClient, agreementAddress: `0x${string}`): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address,
    chain: walletClient.chain,
    address: agreementAddress,
    abi: [{ inputs: [], name: 'complete', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'complete',
    args: [],
  })
  return txHash
}

// --- Cancel ---
export async function cancelAgreement(walletClient: WalletClient, agreementAddress: `0x${string}`, reason: string): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    account: walletClient.account!.address,
    chain: walletClient.chain,
    address: agreementAddress,
    abi: [{ inputs: [{ name: 'reason', type: 'string' }], name: 'cancel', outputs: [], stateMutability: 'nonpayable', type: 'function' }],
    functionName: 'cancel',
    args: [reason],
  })
  return txHash
}
