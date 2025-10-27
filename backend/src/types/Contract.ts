import { OnChainInfo } from './Info.js'

export interface ContractLogEntry {
  action: string
  txHash: string
  account: string
  exporter?: string
  importer?: string
  logistics?: string
  insurance?: string
  inspector?: string
  requiredAmount?: string
  extra?: any
  timestamp: number
  onChainInfo?: OnChainInfo
}

export interface ContractState {
  exporter?: string
  importer?: string
  logistics?: string
  insurance?: string
  inspector?: string
  status?: string
  currentStage?: string
  lastUpdated: number
}

export interface ContractLogs {
  contractAddress: string
  state: ContractState
  history: ContractLogEntry[]
}