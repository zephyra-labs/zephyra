import { getAddress } from "viem"
import DashboardDTO from "../dtos/dashboardDTO.js"
import { DashboardModel } from "../models/dashboardModel.js"
import type { DashboardWallet, DashboardContract, DashboardDocument } from "../types/Dashboard.js"
import { getContractRoles } from "../utils/getContractRoles.js"

export class DashboardService {
  /**
   * Get global dashboard (admin overview)
   */
  static async getDashboard(): Promise<DashboardDTO> {
    const [users, contracts, documents] = await Promise.all([
      DashboardModel.getAllUsers(),
      DashboardModel.getAllContracts(),
      DashboardModel.getAllDocuments(),
    ])

    // --- Wallets ---
    const wallets: DashboardWallet[] = users
      .filter(u => !!u.address)
      .map(u => ({
        address: getAddress(u.address!),
        balance: u.balance ?? 0,
      }))

    // --- Contracts ---
    const recentContracts: DashboardContract[] = contracts
      .map(c => {
        const lastAction = c.history?.[c.history.length - 1] ?? null
        return {
          address: getAddress(c.id),
          createdAt: lastAction?.timestamp ?? 0,
          lastAction,
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)

    // --- Documents ---
    const recentDocuments: DashboardDocument[] = await Promise.all(
      documents.map(async doc => {
        const history = await DashboardModel.getDocumentLogs(doc.id)
        const lastAction = history[history.length - 1] ?? null
        return {
          id: doc.id,
          title: doc.title ?? "Untitled",
          tokenId: doc.tokenId ? Number(doc.tokenId) : 0,
          owner: doc.owner ?? "",
          docType: doc.docType ?? "Unknown",
          status: doc.status ?? "Draft",
          createdAt: doc.createdAt ?? 0,
          updatedAt: doc.updatedAt ?? 0,
          lastAction,
        }
      })
    )

    recentDocuments.sort(
      (a, b) => (b.lastAction?.timestamp ?? b.createdAt ?? 0) - (a.lastAction?.timestamp ?? a.createdAt ?? 0)
    )

    return new DashboardDTO({
      totalWallets: wallets.length,
      totalContracts: contracts.length,
      totalDocuments: documents.length,
      wallets,
      recentContracts,
      recentDocuments: recentDocuments.slice(0, 5),
    })
  }

  /**
   * Get user-specific dashboard data
   */
  static async getUserDashboard(userAddress: string): Promise<DashboardDTO> {
    const normalizedAddress = getAddress(userAddress)
    const [users, contracts, documents] = await Promise.all([
      DashboardModel.getAllUsers(),
      DashboardModel.getAllContracts(),
      DashboardModel.getAllDocuments(),
    ])

    // --- Wallets ---
    const userWallets: DashboardWallet[] = users
      .filter(u => u.address && getAddress(u.address) === normalizedAddress)
      .map(u => ({
        address: normalizedAddress,
        balance: u.balance ?? 0,
      }))

    // --- Contracts related to user ---
    const userContracts: DashboardContract[] = []
    for (const c of contracts) {
      const lastAction = c.history?.[c.history.length - 1] ?? null
      const roles = await getContractRoles(c.id)
      if (roles.exporter === normalizedAddress || roles.importer === normalizedAddress || roles.logistics === normalizedAddress) {
        userContracts.push({
          address: getAddress(c.id),
          createdAt: lastAction?.timestamp ?? 0,
          lastAction,
        })
      }
    }

    userContracts.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))

    // --- Documents related to user ---
    const userDocuments: DashboardDocument[] = []
    for (const doc of documents) {
      const history = await DashboardModel.getDocumentLogs(doc.id)
      const lastAction = history[history.length - 1] ?? null
      const isOwner = doc.owner && getAddress(doc.owner) === normalizedAddress

      let linkedToUser = false
      if (doc.linkedContracts?.length) {
        for (const c of doc.linkedContracts) {
          const roles = await getContractRoles(c)
          if (roles.exporter === normalizedAddress || roles.importer === normalizedAddress || roles.logistics === normalizedAddress) {
            linkedToUser = true
            break
          }
        }
      }

      if (isOwner || linkedToUser) {
        userDocuments.push({
          id: doc.id,
          title: doc.title ?? "Untitled",
          tokenId: doc.tokenId ? Number(doc.tokenId) : 0,
          owner: doc.owner ?? "",
          docType: doc.docType ?? "Unknown",
          status: doc.status ?? "Draft",
          createdAt: doc.createdAt ?? 0,
          updatedAt: doc.updatedAt ?? 0,
          lastAction,
        })
      }
    }

    userDocuments.sort(
      (a, b) => (b.lastAction?.timestamp ?? b.createdAt ?? 0) - (a.lastAction?.timestamp ?? a.createdAt ?? 0)
    )

    return new DashboardDTO({
      totalWallets: userWallets.length,
      totalContracts: userContracts.length,
      totalDocuments: userDocuments.length,
      wallets: userWallets,
      recentContracts: userContracts.slice(0, 5),
      recentDocuments: userDocuments.slice(0, 5),
    })
  }
}
