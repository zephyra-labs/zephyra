/**
 * @file dashboardService.ts
 * @description Business logic for fetching global and user-specific dashboard data,
 * including wallets, contracts, and documents.
 */

import { getAddress } from "viem";
import DashboardDTO from "../dtos/dashboardDTO";
import { DashboardModel } from "../models/dashboardModel";
import type { DashboardWallet, DashboardContract, DashboardDocument } from "../types/Dashboard";
import { getContractRoles } from "../utils/getContractRoles";

export class DashboardService {
  /**
   * Fetch global dashboard data (admin overview) including:
   * - Total wallets, contracts, documents
   * - Recent contracts and documents
   *
   * @async
   * @returns {Promise<DashboardDTO>} Aggregated dashboard data.
   */
  static async getDashboard(): Promise<DashboardDTO> {
    const [users, contracts, documents] = await Promise.all([
      DashboardModel.getAllUsers(),
      DashboardModel.getAllContracts(),
      DashboardModel.getAllDocuments(),
    ]);

    // --- Wallets ---
    const wallets: DashboardWallet[] = users
      .filter(u => !!u.address)
      .map(u => ({
        address: getAddress(u.address!),
        balance: u.balance ?? 0,
      }));

    // --- Contracts ---
    const recentContracts: DashboardContract[] = contracts
      .map(c => {
        const lastAction = c.history?.[c.history.length - 1] ?? null;
        return {
          address: getAddress(c.id),
          createdAt: String(lastAction?.timestamp ?? 0),
          lastAction,
        };
      })
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .slice(0, 5);

    // --- Documents ---
    const recentDocuments: DashboardDocument[] = await Promise.all(
      documents.map(async doc => {
        const history = await DashboardModel.getDocumentLogs(doc.id);
        const lastAction = history[history.length - 1] ?? null;
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
        };
      })
    );

    recentDocuments.sort(
      (a, b) => (b.lastAction?.timestamp ?? b.createdAt ?? 0) - (a.lastAction?.timestamp ?? a.createdAt ?? 0)
    );

    return new DashboardDTO({
      totalWallets: wallets.length,
      totalContracts: contracts.length,
      totalDocuments: documents.length,
      wallets,
      recentContracts,
      recentDocuments: recentDocuments.slice(0, 5),
    });
  }

  /**
   * Fetch user-specific dashboard data, including:
   * - Wallets owned by the user
   * - Contracts where user has roles (exporter/importer/logistics)
   * - Documents owned by or linked to user
   *
   * @async
   * @param {string} userAddress - User wallet address.
   * @returns {Promise<DashboardDTO>} User-specific dashboard data.
   */
  static async getUserDashboard(userAddress: string): Promise<DashboardDTO> {
    const normalizedAddress = getAddress(userAddress);
    const [users, contracts, documents] = await Promise.all([
      DashboardModel.getAllUsers(),
      DashboardModel.getAllContracts(),
      DashboardModel.getAllDocuments(),
    ]);

    // --- Wallets ---
    const userWallets: DashboardWallet[] = users
      .filter(u => u.address && getAddress(u.address) === normalizedAddress)
      .map(u => ({
        address: normalizedAddress,
        balance: u.balance ?? 0,
      }));

    // --- Contracts ---
    const userContracts: DashboardContract[] = [];
    for (const c of contracts) {
      const lastAction = c.history?.[c.history.length - 1] ?? null;
      let roles;
      try {
        roles = await getContractRoles(c.id);
      } catch {
        roles = { exporter: "", importer: "", logistics: "" }; // fallback jika throw
      }
      if (
        roles.exporter === normalizedAddress ||
        roles.importer === normalizedAddress ||
        roles.logistics === normalizedAddress
      ) {
        userContracts.push({
          address: getAddress(c.id),
          createdAt: String(lastAction?.timestamp ?? 0),
          lastAction,
        });
      }
    }
    userContracts.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    // --- Documents ---
    const userDocuments: DashboardDocument[] = [];
    for (const doc of documents) {
      const history = await DashboardModel.getDocumentLogs(doc.id);
      const lastAction = history[history.length - 1] ?? null;
      const isOwner = doc.owner && getAddress(doc.owner) === normalizedAddress;

      let linkedToUser = false;
      if (doc.linkedContracts?.length) {
        for (const c of doc.linkedContracts) {
          let roles;
          try {
            roles = await getContractRoles(c);
          } catch {
            roles = { exporter: "", importer: "", logistics: "" }; // fallback
          }
          if (
            roles.exporter === normalizedAddress ||
            roles.importer === normalizedAddress ||
            roles.logistics === normalizedAddress
          ) {
            linkedToUser = true;
            break;
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
        });
      }
    }

    // --- Documents ---
    userDocuments.sort((a, b) => {
      const aTime = a.lastAction?.timestamp ?? a.createdAt ?? 0;
      const bTime = b.lastAction?.timestamp ?? b.createdAt ?? 0;
      return bTime - aTime;
    });

    return new DashboardDTO({
      totalWallets: userWallets.length,
      totalContracts: userContracts.length,
      totalDocuments: userDocuments.length,
      wallets: userWallets,
      recentContracts: userContracts.slice(0, 5),
      recentDocuments: userDocuments.slice(0, 5),
    });
  }
}
