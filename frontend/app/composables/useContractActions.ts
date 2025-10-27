import { ref, reactive } from 'vue'
import { createPublicClient, http } from 'viem'
import tradeAgreementArtifact from '../../../artifacts/contracts/TradeAgreement.sol/TradeAgreement.json'
import factoryArtifact from '../../../artifacts/contracts/TradeAgreementFactory.sol/TradeAgreementFactory.json'
import mockUSDCArtifact from '../../../artifacts/contracts/MockUSDC.sol/MintableUSDC.json'
import { Chain } from '../config/chain'
import { useToast } from './useToast'
import { useActivityLogs } from './useActivityLogs'
import { useContractLogs } from './useContractLogs'
import type { ContractLogPayload, ContractDetails } from '~/types/Contract'
import { useWallet } from './useWallets'
import { useApi } from './useApi'

const deployedContracts = ref<`0x${string}`[]>([])
const currentStage = ref<number>(-1)

const publicClient = createPublicClient({
  chain: Chain,
  transport: http('http://127.0.0.1:8545'),
})

const factoryAddress = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as `0x${string}`
const factoryAbiFull = factoryArtifact.abi
const tradeAgreementAbi = tradeAgreementArtifact.abi
const mockUSDCAbi = mockUSDCArtifact.abi

export function useContractActions() {
  const { account, walletClient } = useWallet()
  const { addToast } = useToast()
  const { addActivityLog } = useActivityLogs()
  const { addContractLog, fetchContractLogs, getContractState } = useContractLogs()
  const { request } = useApi()

  // ---------------- Step Status ----------------
  const stepStatus = reactive({
    deploy: false,
    sign: { importer: false, exporter: false },
    deposit: false,
    shipping: {
      initiated: false,
      inTransit: false,
      arrivedPort: false,
      customsCleared: false,
      delivered: false,
    },
    completed: false,
    cancelled: false,
  })

  /** Require wallet connection */
  function requireAccount(): `0x${string}` {
    if (!account.value) throw new Error('Wallet not connected')
    return account.value as `0x${string}`
  }
  
  /** Extract on-chain info from receipt */
  const extractOnChainInfo = (receipt: any) => ({
    status: String(receipt.status),
    blockNumber: Number(receipt.blockNumber),
    confirmations: Number(receipt.confirmations ?? 0),
  })

  /** Post log ke contractLogs + activityLogs */
  const postLog = async (data: ContractLogPayload, receipt?: any, tags?: string[]) => {
    const acc = requireAccount()

    if (!data.action) {
      console.warn('Cannot post log: missing action', data)
      return
    }

    // contractAddress bisa kosong sementara untuk deploy
    const isDeploy = data.action.toLowerCase() === 'deploy'
    if (!data.contractAddress && !isDeploy) {
      throw new Error('contractAddress is missing')
    }

    const onChainInfo = receipt
      ? {
          status: String(receipt.status ?? 'unknown'),
          blockNumber: Number(receipt.blockNumber ?? 0),
          confirmations: Number(receipt.confirmations ?? 0),
        }
      : data.onChainInfo
      ? {
          status: String(data.onChainInfo.status ?? 'unknown'),
          blockNumber: Number(data.onChainInfo.blockNumber ?? 0),
          confirmations: Number(data.onChainInfo.confirmations ?? 0),
        }
      : undefined

    try {
      // 1️⃣ simpan ke contractLogs
      const logData = await addContractLog(data.contractAddress ?? 'pending', {
        ...data,
        account: acc,
        onChainInfo,
      })

      if (!logData || !logData.action) {
        console.warn('addContractLog returned invalid data:', logData)
        return
      }

      // 2️⃣ update state reaktif
      const state = getContractState(data.contractAddress ?? 'pending')
      if (state) {
        state.history = [...state.history, logData]
        state.finished = ['complete', 'finalize'].includes(logData.action.toLowerCase())
        state.status = logData.extra?.status ?? logData.action
        state.currentStage = logData.extra?.stage ?? state.currentStage
        state.exporter = logData.extra?.exporter ?? state.exporter
        state.importer = logData.extra?.importer ?? state.importer
        state.logistics = logData.extra?.logistics ?? state.logistics
      }

      // 3️⃣ hanya simpan activity kalau ada contractAddress valid
      if (logData.contractAddress && logData.contractAddress !== 'pending') {
        await addActivityLog(acc, {
          type: 'onChain',
          action: logData.action,
          txHash: logData.txHash,
          contractAddress: logData.contractAddress,
          extra: logData.extra,
          onChainInfo,
          tags,
        })
      } else {
        console.log(`[skip activityLog] no contractAddress yet for action "${logData.action}"`)
      }

      return logData
    } catch (err) {
      console.warn('Failed to post logs:', err)
      throw err
    }
  }

  /** Update stepStatus from stage & signer info */
  const updateStepStatus = async (contractAddress: `0x${string}`, stage?: number) => {
    const s = stage ?? (await getStage(contractAddress))
    const importerSigned = Boolean(await publicClient.readContract({ address: contractAddress, abi: tradeAgreementAbi, functionName: 'importerSigned' }))
    const exporterSigned = Boolean(await publicClient.readContract({ address: contractAddress, abi: tradeAgreementAbi, functionName: 'exporterSigned' }))

    stepStatus.deploy = s >= 0
    stepStatus.sign.importer = importerSigned
    stepStatus.sign.exporter = exporterSigned
    stepStatus.deposit = s >= 4

    // Multi-phase shipping mapping
    stepStatus.shipping.initiated = s >= 5
    stepStatus.shipping.inTransit = s >= 6
    stepStatus.shipping.arrivedPort = s >= 7
    stepStatus.shipping.customsCleared = s >= 8
    stepStatus.shipping.delivered = s >= 9

    stepStatus.completed = s === 10
    stepStatus.cancelled = s === 11

    currentStage.value = s
  }

  // ---------------- Factory / deployed contracts ----------------
  const fetchDeployedContracts = async () => {
    if (!account.value) return []
    try {
      const chainId = await publicClient.getChainId()
      if (chainId !== Chain.id) {
        addToast('Wrong network detected', 'warning')
        deployedContracts.value = []
        return []
      }

      const contracts = await publicClient.readContract({
        address: factoryAddress,
        abi: factoryAbiFull,
        functionName: 'getDeployedContracts',
      })

      deployedContracts.value = contracts as `0x${string}`[]
      addToast(
        deployedContracts.value.length
          ? `Found ${deployedContracts.value.length} deployed contract(s)`
          : 'No deployed contracts found',
        deployedContracts.value.length ? 'success' : 'info',
        3000
      )
      return deployedContracts.value
    } catch (err) {
      console.error(err)
      addToast('Factory not deployed / wrong network', 'error', 4000)
      deployedContracts.value = []
      return []
    }
  }

  /** Deploy new TradeAgreement with logistics role */
  const deployContractWithDocs = async (
    importer: `0x${string}`,
    exporter: `0x${string}`,
    logistics: `0x${string}`,
    importerDocId: bigint,
    exporterDocId: bigint,
    logisticsDocId: bigint,
    requiredAmount: bigint,
    token: `0x${string}`
  ) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')

    const txHash = await walletClient.value.writeContract({
      address: factoryAddress,
      abi: factoryAbiFull,
      functionName: 'deployTradeAgreement',
      args: [importer, exporter, logistics, requiredAmount, importerDocId, exporterDocId, logisticsDocId, token],
      account: account.value,
      chain: Chain,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await fetchDeployedContracts()
    const newContractAddress = deployedContracts.value[deployedContracts.value.length - 1]

    await postLog(
      {
        action: 'deploy',
        account: account.value,
        txHash,
        contractAddress: newContractAddress as `0x${string}`,
        extra: {
          importer,
          exporter,
          logistics,
          requiredAmount: requiredAmount.toString(),
          importerDocId: importerDocId.toString(),
          exporterDocId: exporterDocId.toString(),
          logisticsDocId: logisticsDocId.toString(),
          token,
        },
      },
      receipt,
      ['deploy', 'tradeAgreement', 'contract']
    )

    return newContractAddress
  }

  // ---------------- TradeAgreement helpers ----------------
  const getStage = async (contractAddress: `0x${string}`): Promise<number> => {
    try {
      return (await publicClient.readContract({
        address: contractAddress,
        abi: tradeAgreementAbi,
        functionName: 'currentStage',
      })) as number
    } catch (err) {
      console.error('Failed to get stage:', err)
      return 0
    }
  }

  const fetchContractDetails = async (contractAddress: `0x${string}`) => {
    try {
      const data = await request<ContractDetails>(`/contract/${contractAddress}/details`)
      await updateStepStatus(contractAddress)
      await fetchContractLogs(contractAddress)
      data.logs = getContractState(contractAddress).history
      return data
    } catch (err) {
      console.error('Get contract details error:', err)
      return null
    }
  }

  // ---------------- Standard Actions ----------------
  const depositToContract = async (contractAddress: `0x${string}`, amount: bigint) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const token = await publicClient.readContract({ address: contractAddress, abi: tradeAgreementAbi, functionName: 'token' }) as `0x${string}`

    let txHash: `0x${string}`
    if (token === '0x0000000000000000000000000000000000000000') {
      txHash = await walletClient.value.writeContract({
        address: contractAddress,
        abi: tradeAgreementAbi,
        functionName: 'deposit',
        args: [amount],
        account: account.value,
        chain: Chain,
        value: amount,
      })
    } else {
      const approveTx = await walletClient.value.writeContract({
        address: token,
        abi: mockUSDCAbi,
        functionName: 'approve',
        args: [contractAddress, amount],
        account: account.value,
        chain: Chain,
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx as `0x${string}` })

      txHash = await walletClient.value.writeContract({
        address: contractAddress,
        abi: tradeAgreementAbi,
        functionName: 'deposit',
        args: [amount],
        account: account.value,
        chain: Chain,
      })
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'deposit', account: account.value, txHash, contractAddress, extra: { amount: amount.toString(), token } }, receipt, ['deposit'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const signAgreement = async (contractAddress: `0x${string}`) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'sign',
      args: [],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'sign', account: account.value, txHash, contractAddress }, receipt, ['sign'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  // ---------------- Shipping Multi-Phase Actions ----------------
  const startShipping = async (contractAddress: `0x${string}`, details: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'startShipping',
      args: [details],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'startShipping', account: account.value, txHash, contractAddress, extra: { details } }, receipt, ['shipping'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const markInTransit = async (contractAddress: `0x${string}`, details: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'markInTransit',
      args: [details],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'markInTransit', account: account.value, txHash, contractAddress, extra: { details } }, receipt, ['shipping'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const confirmArrival = async (contractAddress: `0x${string}`, details: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'confirmArrival',
      args: [details],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'confirmArrival', account: account.value, txHash, contractAddress, extra: { details } }, receipt, ['shipping'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const customsClearance = async (contractAddress: `0x${string}`, details: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'customsClearance',
      args: [details],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'customsClearance', account: account.value, txHash, contractAddress, extra: { details } }, receipt, ['shipping'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const confirmDelivery = async (contractAddress: `0x${string}`, details: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'confirmDelivery',
      args: [details],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'confirmDelivery', account: account.value, txHash, contractAddress, extra: { details } }, receipt, ['shipping'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  // ---------------- Complete / Cancel ----------------
  const completeContract = async (contractAddress: `0x${string}`) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'complete',
      args: [],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'complete', account: account.value, txHash, contractAddress }, receipt, ['complete'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  const cancelContract = async (contractAddress: `0x${string}`, reason: string) => {
    if (!walletClient.value || !account.value) throw new Error('Wallet not connected')
    const txHash = await walletClient.value.writeContract({
      address: contractAddress,
      abi: tradeAgreementAbi,
      functionName: 'cancel',
      args: [reason],
      account: account.value,
      chain: Chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    await postLog({ action: 'cancel', account: account.value, txHash, contractAddress, extra: { reason } }, receipt, ['cancel'])
    await updateStepStatus(contractAddress)
    await fetchContractLogs(contractAddress)
    return receipt
  }

  // ---------------- Stage Mapper ----------------
  const mapStageToStepStatus = async (contractAddress: `0x${string}`) => {
    await updateStepStatus(contractAddress)
  }

  return {
    deployedContracts,
    stepStatus,
    currentStage,
    fetchDeployedContracts,
    fetchContractDetails,
    deployContractWithDocs,
    getStage,
    depositToContract,
    signAgreement,
    startShipping,
    markInTransit,
    confirmArrival,
    customsClearance,
    confirmDelivery,
    completeContract,
    cancelContract,
    updateStepStatus,
    mapStageToStepStatus,
  }
}
