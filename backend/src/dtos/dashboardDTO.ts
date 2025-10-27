import type { DashboardWallet, DashboardContract, DashboardDocument } from "../types/Dashboard.js"

export default class DashboardDTO {
  totalWallets: number
  totalContracts: number
  totalDocuments: number
  wallets: DashboardWallet[]
  recentContracts: DashboardContract[]
  recentDocuments: DashboardDocument[]

  constructor(data: Partial<DashboardDTO>) {
    this.totalWallets = data.totalWallets ?? 0
    this.totalContracts = data.totalContracts ?? 0
    this.totalDocuments = data.totalDocuments ?? 0
    this.wallets = data.wallets ?? []
    this.recentContracts = data.recentContracts ?? []
    this.recentDocuments = data.recentDocuments ?? []
  }

  toResponse() {
    return {
      totalWallets: this.totalWallets,
      totalContracts: this.totalContracts,
      totalDocuments: this.totalDocuments,
      wallets: this.wallets,
      recentContracts: this.recentContracts,
      recentDocuments: this.recentDocuments,
    }
  }
}
