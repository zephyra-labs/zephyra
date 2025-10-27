export interface Wallet {
  address: `0x${string}`
  balance: number
}

export interface WalletLog {
  account: string
  action: string
  timestamp: number
}