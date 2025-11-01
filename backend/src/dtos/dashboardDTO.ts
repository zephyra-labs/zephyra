/**
 * @file DashboardDTO.ts
 * @description Data Transfer Object for Dashboard data including wallets, contracts, and documents.
 */

import type { DashboardWallet, DashboardContract, DashboardDocument } from "../types/Dashboard.js";

/**
 * DTO for Dashboard data
 */
export default class DashboardDTO {
  /** Total number of wallets */
  totalWallets: number;

  /** Total number of contracts */
  totalContracts: number;

  /** Total number of documents */
  totalDocuments: number;

  /** List of wallets for the dashboard */
  wallets: DashboardWallet[];

  /** List of recent contracts */
  recentContracts: DashboardContract[];

  /** List of recent documents */
  recentDocuments: DashboardDocument[];

  /**
   * Constructor for DashboardDTO
   * @param {Partial<DashboardDTO>} data Partial dashboard data
   */
  constructor(data: Partial<DashboardDTO>) {
    this.totalWallets = data.totalWallets ?? 0;
    this.totalContracts = data.totalContracts ?? 0;
    this.totalDocuments = data.totalDocuments ?? 0;
    this.wallets = data.wallets ?? [];
    this.recentContracts = data.recentContracts ?? [];
    this.recentDocuments = data.recentDocuments ?? [];
  }

  /**
   * Transform DTO into plain object for API response
   * @returns {Object} Dashboard response object
   */
  toResponse() {
    return {
      totalWallets: this.totalWallets,
      totalContracts: this.totalContracts,
      totalDocuments: this.totalDocuments,
      wallets: this.wallets,
      recentContracts: this.recentContracts,
      recentDocuments: this.recentDocuments,
    };
  }
}
