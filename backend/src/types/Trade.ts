export type TradeStatus = 'draft' | 'readyToTrade' | 'inProgress' | 'completed' | 'cancelled'

export interface TradeParticipant {
  address: string
  kycVerified: boolean
  walletConnected: boolean
  role?: 'exporter' | 'importer' | 'logistics' | 'insurance' | 'inspector'
}

export interface TradeRecord {
  id: string
  contractAddress?: string
  participants: TradeParticipant[]
  status: TradeStatus
  currentStage?: number
  createdAt: number
  updatedAt?: number
}
