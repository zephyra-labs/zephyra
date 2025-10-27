export interface ActivityLog {
  timestamp: number
  type: 'onChain' | 'backend'
  action: string
  account: string
  txHash?: string
  contractAddress?: string
  extra?: Record<string, any>
  onChainInfo?: {
    status: string
    blockNumber: number
    confirmations: number
  }
}

export type ActivityLogPayload = Omit<ActivityLog, 'timestamp'>

// opsional: state
export interface ActivityState {
  logs: ActivityLog[]
  loading: boolean
  finished: boolean
  lastTimestamp?: number
}
