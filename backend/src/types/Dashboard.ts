export interface DashboardWallet {
  address: `0x${string}`
  balance: number
}

export interface DashboardContract {
  address: `0x${string}`
  owner?: `0x${string}`
  createdAt: string,
  lastAction?: {
    action: string
    account?: string
    timestamp: number
  } | null
}

export interface DashboardDocument {
  id: string
  tokenId?: number
  owner: string
  title?: string
  docType?: string
  status?: string
  createdAt?: number
  updatedAt?: number
  lastAction?: {
    action: string
    account?: string
    timestamp: number
  } | null
}

export interface DashboardStats {
  totalContracts: number
  totalDocuments: number
  totalWallets: number
}

export interface DashboardData extends DashboardStats {
  recentContracts: DashboardContract[]
  recentDocuments: DashboardDocument[]
  wallets: DashboardWallet[]
}
