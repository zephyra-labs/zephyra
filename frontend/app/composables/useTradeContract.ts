import { ref, computed, watch } from 'vue'
import { useWallet } from '~/composables/useWallets'
import { useToast } from '~/composables/useToast'
import { useTx } from '~/composables/useTx'
import { useKYC } from '~/composables/useKycs'
import { useContractRole } from '~/composables/useContractRole'
import { useContractActions } from '~/composables/useContractActions'

export function useTradeContract() {
  // ----------------- Composables -----------------
  const { account } = useWallet()
  const { addToast } = useToast()
  const { withTx } = useTx()
  const { getKycsByOwner } = useKYC()

  const {
    deployedContracts,
    fetchDeployedContracts,
    stepStatus,
    deployContractWithDocs,
    fetchContractDetails,
    depositToContract,
    signAgreement,
    startShipping,
    markInTransit,
    confirmArrival,
    customsClearance,
    confirmDelivery,
    completeContract,
    cancelContract,
    mapStageToStepStatus,
    currentStage,
  } = useContractActions()

  const selectedContractRef = ref<string | null>(null)
  const { isAdmin, isImporter, isExporter, isLogistics, userRole, getContractRoles } = useContractRole(selectedContractRef)

  // ----------------- State -----------------
  const selectedContract = selectedContractRef
  const latestContract = ref<string | null>(null)
  const importerAddress = ref('')
  const exporterAddress = ref('')
  const logisticsAddress = ref('')
  const requiredAmount = ref('')
  const paymentToken = ref<'ETH' | 'MUSDC'>('ETH')
  const backendImporter = ref('')
  const backendExporter = ref('')
  const backendLogistics = ref('')
  const backendRequiredAmount = ref('')
  const backendToken = ref<'ETH' | 'MUSDC' | null>(null)
  const loadingButton = ref<'deploy'|'deposit'|'sign'|'shipping'|'completed'|'cancel'|null>(null)

  // ----------------- Computed -----------------
  const paymentTokenValue = computed({
    get: () => backendToken.value || paymentToken.value || 'ETH',
    set: (val: 'ETH' | 'MUSDC') => paymentToken.value = val
  })

  const tokenAddress = computed(() => {
    if (paymentTokenValue.value === 'ETH') return '0x0000000000000000000000000000000000000000'
    const usdcAddr = import.meta.env.VITE_MOCK_USDC_ADDRESS
    if (!usdcAddr) throw new Error('MUSDC address not set in .env')
    return usdcAddr
  })

  const currentContract = computed(() => latestContract.value ?? selectedContract.value)
  const signCompleted = computed(() => stepStatus.sign.importer && stepStatus.sign.exporter)
  const importerValue = computed({ get: () => importerAddress.value || backendImporter.value, set: val => importerAddress.value = val })
  const exporterValue = computed({ get: () => exporterAddress.value || backendExporter.value, set: val => exporterAddress.value = val })
  const logisticsValue = computed({ get: () => logisticsAddress.value || backendLogistics.value, set: val => logisticsAddress.value = val })

  const requiredAmountValue = computed({
    get: () => {
      let amountStr = requiredAmount.value
        ? String(requiredAmount.value) 
        : ''

      if (!amountStr && backendRequiredAmount.value) {
        try {
          const amountBig = BigInt(backendRequiredAmount.value)
          amountStr = paymentTokenValue.value === 'ETH'
            ? (Number(amountBig) / 1e18).toFixed(4)
            : (Number(amountBig) / 1e6).toFixed(4)
        } catch (err) {
          console.warn('Failed to parse backendRequiredAmount:', backendRequiredAmount.value)
          amountStr = ''
        }
      }

      return amountStr ? String(amountStr).replace(/\.?0+$/, '') : ''
    },
    set: (val: string) => { requiredAmount.value = val }
  })

  // ----------------- Button availability -----------------
  const canDeploy = computed(() => !stepStatus.deploy && !loadingButton.value)
  const canSign = computed(() => {
    if (!stepStatus.deploy || loadingButton.value === 'sign') return false
    if (userRole.value === 'importer' && !stepStatus.sign.importer) return true
    if (userRole.value === 'exporter' && !stepStatus.sign.exporter) return true
    return false
  })
  const canDeposit = computed(() => isImporter.value && stepStatus.deploy && !stepStatus.deposit && signCompleted.value && !loadingButton.value)
  const canStartShipping = computed(() => isExporter.value && stepStatus.deposit && !stepStatus.shipping.initiated && !loadingButton.value)
  const canMarkInTransit = computed(() => isLogistics.value && stepStatus.shipping.initiated && !stepStatus.shipping.inTransit && !loadingButton.value)
  const canConfirmArrival = computed(() => isLogistics.value && stepStatus.shipping.inTransit && !stepStatus.shipping.arrivedPort && !loadingButton.value)
  const canCustomsClearance = computed(() => isLogistics.value && stepStatus.shipping.arrivedPort && !stepStatus.shipping.customsCleared && !loadingButton.value)
  const canConfirmDelivery = computed(() => (isLogistics.value || isImporter.value) && stepStatus.shipping.customsCleared && !stepStatus.shipping.delivered && !loadingButton.value)
  const canComplete = computed(() => isImporter.value && stepStatus.shipping.delivered && !stepStatus.completed && !loadingButton.value)
  const canCancel = computed(() => stepStatus.deploy && !stepStatus.completed && !stepStatus.cancelled && !loadingButton.value)

  // ----------------- Helpers -----------------
  const getFirstTokenIdByOwner = async (owner: `0x${string}`): Promise<bigint | null> => {
    const nfts = await getKycsByOwner(owner)
    return nfts.length ? BigInt(nfts[0]!.tokenId) : null
  }

  // ----------------- Watches -----------------
  watch([selectedContract, account], async ([contract, acc]) => {
    if (!contract || !acc) return
    await getContractRoles(contract)
  }, { immediate: true })

  watch(account, (acc) => { if (acc) fetchDeployedContracts() }, { immediate: true })

  watch(selectedContract, async (contract) => {
    if (!contract) return
    importerAddress.value = exporterAddress.value = logisticsAddress.value = requiredAmount.value = ''
    backendImporter.value = backendExporter.value = backendLogistics.value = backendRequiredAmount.value = ''
    backendToken.value = null
    try {
      const data = await fetchContractDetails(contract as `0x${string}`)
      const deployLog = data?.data?.history.find((h: any) => h.action === 'deploy')
      if (deployLog) {
        backendImporter.value = deployLog.extra?.importer ?? ''
        backendExporter.value = deployLog.extra?.exporter ?? ''
        backendLogistics.value = deployLog.extra?.logistics ?? ''
        backendRequiredAmount.value = deployLog.extra?.requiredAmount ? BigInt(deployLog.extra.requiredAmount).toString() : ''
        const tokenAddr = deployLog.extra?.token
        backendToken.value =
          tokenAddr === '0x0000000000000000000000000000000000000000' ? 'ETH'
          : tokenAddr === import.meta.env.VITE_MOCK_USDC_ADDRESS ? 'MUSDC'
          : null
      }
      await mapStageToStepStatus(contract as `0x${string}`)
    } catch (err) { console.error(err) }
  }, { immediate: true })

  // ----------------- Handlers -----------------
  const handleDeploy = async () => {
    if (!account.value) return addToast('Connect wallet first', 'error')
    if (!importerAddress.value) return addToast('Importer required', 'error')
    if (!exporterAddress.value) return addToast('Exporter required', 'error')
    if (!logisticsAddress.value) return addToast('Logistics required', 'error')
    if (!requiredAmount.value) return addToast('Required amount required', 'error')

    loadingButton.value = 'deploy'
    await withTx(async () => {
      const weiAmount = paymentTokenValue.value === 'ETH'
        ? BigInt(Math.floor(parseFloat(requiredAmount.value) * 1e18))
        : BigInt(Math.floor(parseFloat(requiredAmount.value) * 1e6))

      const importerTokenId = await getFirstTokenIdByOwner(importerAddress.value as `0x${string}`)
      if (!importerTokenId) throw new Error('No NFT found for importer')
      const exporterTokenId = await getFirstTokenIdByOwner(exporterAddress.value as `0x${string}`)
      if (!exporterTokenId) throw new Error('No NFT found for exporter')
      const logisticsTokenId = await getFirstTokenIdByOwner(logisticsAddress.value as `0x${string}`)
      if (!logisticsTokenId) throw new Error('No NFT found for logistics')

      const contractAddress = await deployContractWithDocs(
        importerAddress.value as `0x${string}`,
        exporterAddress.value as `0x${string}`,
        logisticsAddress.value as `0x${string}`,
        importerTokenId,
        exporterTokenId,
        logisticsTokenId,
        weiAmount,
        tokenAddress.value
      )

      selectedContract.value = latestContract.value = contractAddress ?? null
      await mapStageToStepStatus(contractAddress as `0x${string}`)
      addToast(`Contract deployed at ${contractAddress}`, 'success')
    }, { label: 'Deploy Contract' })
    loadingButton.value = null
  }

  const handleDeposit = async () => {
    if (!currentContract.value) return addToast('Select a contract first', 'error')
    loadingButton.value = 'deposit'
    await withTx(async () => {
      const amount = backendRequiredAmount.value === requiredAmount.value
        ? BigInt(Math.floor(parseFloat(requiredAmount.value) * (paymentTokenValue.value === 'ETH' ? 1e18 : 1e6)))
        : BigInt(backendRequiredAmount.value)
      await depositToContract(currentContract.value as `0x${string}`, amount)
      await mapStageToStepStatus(currentContract.value as `0x${string}`)
      addToast('Deposit successful', 'success')
    }, { label: 'Deposit' })
    loadingButton.value = null
  }

  const handleSign = async () => {
    if (!currentContract.value) return
    loadingButton.value = 'sign'
    await withTx(async () => {
      await signAgreement(currentContract.value as `0x${string}`)
      await mapStageToStepStatus(currentContract.value as `0x${string}`)
      addToast('Agreement signed', 'success')
    }, { label: 'Sign Agreement' })
    loadingButton.value = null
  }

  const handleShippingPhase = async (phase: 'start'|'inTransit'|'arrival'|'customs'|'delivery') => {
    if (!currentContract.value) return
    loadingButton.value = 'shipping'
    await withTx(async () => {
      switch(phase) {
        case 'start': await startShipping(currentContract.value as `0x${string}`, exporterAddress.value as `0x${string}`); break
        case 'inTransit': await markInTransit(currentContract.value as `0x${string}`, logisticsAddress.value as `0x${string}`); break
        case 'arrival': await confirmArrival(currentContract.value as `0x${string}`, logisticsAddress.value as `0x${string}`); break
        case 'customs': await customsClearance(currentContract.value as `0x${string}`, importerAddress.value as `0x${string}`); break
        case 'delivery': await confirmDelivery(currentContract.value as `0x${string}`, importerAddress.value as `0x${string}`); break
      }
      await mapStageToStepStatus(currentContract.value as `0x${string}`)
      addToast(`Shipping phase "${phase}" completed`, 'success')
    }, { label: `Shipping: ${phase}` })
    loadingButton.value = null
  }

  const handleComplete = async () => {
    if (!currentContract.value) return
    loadingButton.value = 'completed'
    await withTx(async () => {
      await completeContract(currentContract.value as `0x${string}`)
      await mapStageToStepStatus(currentContract.value as `0x${string}`)
      addToast('Contract completed', 'success')
    }, { label: 'Complete Contract' })
    loadingButton.value = null
  }

  const handleCancel = async () => {
    if (!currentContract.value) return
    const reason = prompt('Reason for cancellation:')
    if (!reason) return
    loadingButton.value = 'cancel'
    await withTx(async () => {
      await cancelContract(currentContract.value as `0x${string}`, reason)
      await mapStageToStepStatus(currentContract.value as `0x${string}`)
      addToast('Contract cancelled', 'info')
    }, { label: 'Cancel Contract' })
    loadingButton.value = null
  }

  const handleNewContract = () => {
    selectedContract.value = latestContract.value = null
    importerAddress.value = exporterAddress.value = logisticsAddress.value = requiredAmount.value = ''
    backendImporter.value = backendExporter.value = backendLogistics.value = backendRequiredAmount.value = ''
    backendToken.value = null
    Object.assign(stepStatus, {
      deploy: false,
      deposit: false,
      sign: { importer: false, exporter: false },
      shipping: { initiated:false,inTransit:false,arrivedPort:false,customsCleared:false,delivered:false },
      completed: false,
      cancelled: false
    })
    currentStage.value = -1
    addToast('Ready to create a new contract', 'info')
  }

  const handleRefreshContracts = async () => {
    try {
      const res = await fetchDeployedContracts()
      addToast(`Refreshed ${res.length || 0} contracts`, 'success')
    } catch (err) { addToast('Failed to refresh contracts', 'error') }
  }
  
  // ----------------- Auto-filled flags -----------------
  const isTokenAutoFilled = computed(() => !!backendToken.value)
  
  const isAutoFilled = computed(() =>
    !!backendExporter.value && !exporterAddress.value &&
    !!backendImporter.value && !importerAddress.value &&
    !!backendLogistics.value && !logisticsAddress.value &&
    !!backendRequiredAmount.value && !requiredAmount.value
  )
  
  const loadContractData = async (address: string) => {
    if (!address) return
    selectedContract.value = address

    // Reset dulu semua value backend & input
    importerAddress.value = ''
    exporterAddress.value = ''
    requiredAmount.value = ''
    backendImporter.value = ''
    backendExporter.value = ''
    backendRequiredAmount.value = ''
    backendToken.value = null

    try {
      const data = await fetchContractDetails(address as `0x${string}`)
      const deployLog = data?.history?.find((h: any) => h.action === 'deploy')
      if (deployLog) {
        backendImporter.value = deployLog.extra?.importer || ''
        backendExporter.value = deployLog.extra?.exporter || ''
        backendRequiredAmount.value = deployLog.extra?.requiredAmount
          ? (BigInt(deployLog.extra.requiredAmount)).toString()
          : ''
        const tokenAddr = deployLog.extra?.token
        backendToken.value =
          tokenAddr === '0x0000000000000000000000000000000000000000' ? 'ETH'
          : tokenAddr === import.meta.env.VITE_MOCK_USDC_ADDRESS ? 'MUSDC'
          : null
      }
    } catch (err) {
      console.error('Failed to load contract data:', err)
    }
  }

  return {
    // state
    selectedContract, latestContract, importerAddress, exporterAddress, logisticsAddress, requiredAmount,
    paymentToken, backendImporter, backendExporter, backendLogistics, backendRequiredAmount, backendToken,
    loadingButton, stepStatus, currentStage, deployedContracts, isAutoFilled, isTokenAutoFilled,

    // computed
    paymentTokenValue, tokenAddress, currentContract, signCompleted,
    importerValue, exporterValue, logisticsValue, requiredAmountValue,
    canDeploy, canSign, canDeposit, canStartShipping, canMarkInTransit,
    canConfirmArrival, canCustomsClearance, canConfirmDelivery,
    canComplete, canCancel, isAdmin, isImporter, isExporter, isLogistics, userRole,

    // handlers
    handleDeploy, handleDeposit, handleSign,
    handleShippingPhase, handleComplete, handleCancel,
    handleNewContract, handleRefreshContracts, loadContractData
  }
}
