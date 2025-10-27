export interface DashboardWallet {
  address: `0x${string}`
  balance: number
}

export interface DashboardLogEntry {
  action: string
  account: string
  timestamp: number
  [key: string]: any
}

export interface DashboardContract {
  address: `0x${string}`
  createdAt: number
  lastAction?: DashboardLogEntry | null
}

export interface DashboardDocument {
  id: string
  title: string
  tokenId: number
  owner: `0x${string}`
  docType: string
  status: string
  createdAt: number
  updatedAt: number
  lastAction?: DashboardLogEntry | null
}

export interface DashboardData {
  totalWallets: number
  totalContracts: number
  totalDocuments: number
  wallets: DashboardWallet[]
  recentContracts: DashboardContract[]
  recentDocuments: DashboardDocument[]
}
