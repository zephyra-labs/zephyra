/**
 * @file dashboardService.test.ts
 * @description Unit tests for DashboardService
 */

import { DashboardService } from "../dashboardService";
import { DashboardModel } from "../../models/dashboardModel";
import { getContractRoles } from "../../utils/getContractRoles";
import { getAddress } from "viem"; // ✅ import getAddress
import type { DashboardWallet, DashboardContract, DashboardDocument } from "../../types/Dashboard";

// 🔹 Mock dependencies
jest.mock("../../models/dashboardModel");
jest.mock("../../utils/getContractRoles");

describe("DashboardService", () => {
  const mockUsers = [
    { address: "0x1111111111111111111111111111111111111111", balance: 100 },
    { address: "0x2222222222222222222222222222222222222222", balance: 200 },
    { address: null, balance: 0 },
  ];

  const mockContracts = [
    { id: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", history: [{ timestamp: 1000 }] },
    { id: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", history: [{ timestamp: 2000 }] },
  ];

  const mockDocuments = [
    {
      id: "doc1",
      title: "Doc 1",
      tokenId: "1",
      owner: "0x1111111111111111111111111111111111111111",
      docType: "TypeA",
      status: "Draft",
      createdAt: 1000,
      updatedAt: 2000,
      linkedContracts: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
    },
    {
      id: "doc2",
      title: "Doc 2",
      tokenId: "2",
      owner: "0x2222222222222222222222222222222222222222",
      docType: "TypeB",
      status: "Final",
      createdAt: 1500,
      updatedAt: 2500,
      linkedContracts: []
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboard", () => {
    it("should return aggregated global dashboard data", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(mockContracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (DashboardModel.getDocumentLogs as jest.Mock).mockImplementation(async (id: string) => [{ timestamp: 5000 }]);

      const result = await DashboardService.getDashboard();

      expect(result.totalWallets).toBe(2);
      expect(result.totalContracts).toBe(2);
      expect(result.totalDocuments).toBe(2);

      expect(result.wallets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ address: expect.any(String), balance: 100 }),
          expect.objectContaining({ address: expect.any(String), balance: 200 }),
        ])
      );

      expect(result.recentContracts.length).toBe(2);
      expect(result.recentDocuments.length).toBe(2);
    });
  });

  describe("getUserDashboard", () => {
    it("should return user-specific dashboard data", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(mockContracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([{ timestamp: 5000 }]);

      (getContractRoles as jest.Mock).mockImplementation(async (contractId: string) => ({
        exporter: "0x1111111111111111111111111111111111111111",
        importer: "0x2222222222222222222222222222222222222222",
        logistics: "0x3333333333333333333333333333333333333333",
      }));

      const userAddress = "0x1111111111111111111111111111111111111111";
      const result = await DashboardService.getUserDashboard(userAddress);

      expect(result.totalWallets).toBe(1);
      expect(result.totalContracts).toBe(2);
      expect(result.totalDocuments).toBe(1);

      expect(result.wallets[0].address).toBe(getAddress(userAddress));
      expect(result.recentContracts[0].address).toBe(getAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    });
  });
});
