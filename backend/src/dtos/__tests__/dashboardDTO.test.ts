/**
 * @file dashboardDTO.test.ts
 * @description Unit tests for DashboardDTO
 */

import DashboardDTO from "../dashboardDTO";
import type { DashboardWallet, DashboardContract, DashboardDocument } from "../../types/Dashboard";

describe("DashboardDTO", () => {
  it("should set default values when no data provided", () => {
    const dto = new DashboardDTO({});
    expect(dto.totalWallets).toBe(0);
    expect(dto.totalContracts).toBe(0);
    expect(dto.totalDocuments).toBe(0);
    expect(dto.wallets).toEqual([]);
    expect(dto.recentContracts).toEqual([]);
    expect(dto.recentDocuments).toEqual([]);
  });

  it("should accept custom values", () => {
    const wallets: DashboardWallet[] = [{ address: "0xabc", balance: 100 }];
    const contracts: DashboardContract[] = [{ address: "0xdef", createdAt: new Date().toISOString() }];
    const documents: DashboardDocument[] = [{ tokenId: 1, owner: "0xabc", id: "doc1" }];

    const dto = new DashboardDTO({
      totalWallets: 5,
      totalContracts: 3,
      totalDocuments: 10,
      wallets,
      recentContracts: contracts,
      recentDocuments: documents,
    });

    expect(dto.totalWallets).toBe(5);
    expect(dto.totalContracts).toBe(3);
    expect(dto.totalDocuments).toBe(10);
    expect(dto.wallets).toEqual(wallets);
    expect(dto.recentContracts).toEqual(contracts);
    expect(dto.recentDocuments).toEqual(documents);
  });

  it("toResponse should return correct plain object", () => {
    const wallets: DashboardWallet[] = [{ address: "0xabc", balance: 100 }];
    const contracts: DashboardContract[] = [{ address: "0xdef", createdAt: Date.now().toString() }];
    const documents: DashboardDocument[] = [{ tokenId: 1, owner: "0xabc", id: "doc1" }];

    const dto = new DashboardDTO({
      totalWallets: 5,
      totalContracts: 3,
      totalDocuments: 10,
      wallets,
      recentContracts: contracts,
      recentDocuments: documents,
    });

    const res = dto.toResponse();
    expect(res).toEqual({
      totalWallets: 5,
      totalContracts: 3,
      totalDocuments: 10,
      wallets,
      recentContracts: contracts,
      recentDocuments: documents,
    });
  });
});
