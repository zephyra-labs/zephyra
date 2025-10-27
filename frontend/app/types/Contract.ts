import type { OnChainInfo } from './Info'

export interface ContractLogEntry {
  action: string
  txHash?: string
  account: string
  exporter?: string
  importer?: string
  logistics?: string
  insurance?: string
  inspector?: string
  requiredAmount?: string
  contractAddress: string 
  extra?: any
  timestamp: number
  onChainInfo?: OnChainInfo
}

export interface ContractState {
  // Backend state
  exporter?: string
  importer?: string
  logistics?: string
  insurance?: string
  inspector?: string
  status?: string
  currentStage?: string
  lastUpdated?: number

  // Frontend UI state
  name?: string
  isOpen: boolean
  history: ContractLogEntry[]
  loading: boolean
  finished: boolean
  lastTimestamp?: number
  role?: 'Importer' | 'Exporter' | 'Logistics' | 'Guest'
  documentCount?: number
}

export interface ContractLogs {
  contractAddress: string
  state: ContractState
  history: ContractLogEntry[]
}

export type ContractLogPayload = Omit<ContractLogEntry, 'timestamp'> & {
  contractAddress: string
  onChainInfo?: Partial<OnChainInfo>
}

export interface ContractDetails {
  id: string
  contractAddress: `0x${string}`
  importer: string
  exporter: string
  amount: string
  logs?: ContractLogEntry[]
  [key: string]: any
}

export interface MyContractData {
  contractAddress: string
  history: ContractLogEntry[]
  role?: 'Importer' | 'Exporter' | 'Logistics' | 'Guest'
}
