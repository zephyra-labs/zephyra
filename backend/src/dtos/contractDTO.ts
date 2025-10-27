import type { ContractLogEntry, ContractState } from '../types/Contract.js'
import type { OnChainInfo } from '../types/Info.js'

export default class ContractLogDTO {
  contractAddress!: string
  action!: string
  txHash!: string
  account!: string

  exporter?: string
  importer?: string
  logistics?: string
  insurance?: string
  inspector?: string
  requiredAmount?: string
  status?: string
  currentStage?: string
  extra?: any
  timestamp!: number
  onChainInfo?: OnChainInfo

  // --- Optional for controller / service use ---
  verifyOnChain?: boolean
  state?: Partial<ContractState>

  constructor(
    data: Partial<ContractLogEntry> & {
      contractAddress: string
      verifyOnChain?: boolean
      state?: Partial<ContractState>
      status?: string
      currentStage?: string
    },
  ) {
    Object.assign(this, data)
  }

  validate() {
    if (!this.contractAddress) throw new Error('contractAddress required')
    if (!this.action) throw new Error('action required')
    if (!this.txHash) throw new Error('txHash required')
    if (!this.account) throw new Error('account required')
  }

  toLogEntry(): ContractLogEntry {
    return {
      action: this.action,
      txHash: this.txHash,
      account: this.account,
      exporter: this.exporter,
      importer: this.importer,
      logistics: this.logistics,
      insurance: this.insurance,
      inspector: this.inspector,
      requiredAmount: this.requiredAmount,
      extra: this.extra ?? null,
      timestamp: this.timestamp ?? Date.now(),
      onChainInfo: this.onChainInfo,
    }
  }

  toState(): Partial<ContractState> {
    return {
      exporter: this.exporter,
      importer: this.importer,
      logistics: this.logistics,
      insurance: this.insurance,
      inspector: this.inspector,
      status: this.status ?? this.state?.status,
      currentStage: this.currentStage ?? this.state?.currentStage,
      lastUpdated: Date.now(),
    }
  }
}
