/**
 * @file dashboardService.test.ts
 * @description Unit tests for DashboardService with full branch coverage
 */

import { DashboardService } from "../dashboardService";
import { DashboardModel } from "../../models/dashboardModel";
import { getContractRoles } from "../../utils/getContractRoles";
import { getAddress } from "viem";

// 🔹 Mock dependencies
jest.mock("../../models/dashboardModel");
jest.mock("../../utils/getContractRoles");

// ✅ Valid Ethereum addresses
const ADDR_1 = "0x1111111111111111111111111111111111111111";
const ADDR_2 = "0x2222222222222222222222222222222222222222";
const ADDR_3 = "0x3333333333333333333333333333333333333333";
const ADDR_4 = "0x4444444444444444444444444444444444444444";

describe("DashboardService", () => {
  const mockUsers = [
    { address: ADDR_1, balance: 100 },
    { address: ADDR_2, balance: 200 },
    { address: null, balance: 0 },
  ];

  const mockContracts = [
    { id: ADDR_3, history: [{ timestamp: 1000 }] },
    { id: ADDR_4, history: [{ timestamp: 2000 }] },
    { id: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", history: [] },
  ];

  const mockDocuments = [
    { id: "doc1", title: "Doc 1", tokenId: "1", owner: ADDR_1, docType: "TypeA", status: "Draft", createdAt: 1000, updatedAt: 2000, linkedContracts: [ADDR_3] },
    { id: "doc2", title: "Doc 2", tokenId: "2", owner: ADDR_2, docType: "TypeB", status: "Final", createdAt: 1500, updatedAt: 2500, linkedContracts: [] },
    { id: "doc3", title: "No Owner Doc", tokenId: null, owner: null, docType: null, status: null, createdAt: 50, updatedAt: 60, linkedContracts: null },
  ];

  beforeEach(() => jest.clearAllMocks());

  // -------------------
  // getDashboard tests
  // -------------------
  describe("getDashboard", () => {
    it("should aggregate wallets, contracts, documents with proper sorting", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(mockContracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([{ timestamp: 5000 }]);

      const result = await DashboardService.getDashboard();

      expect(result.totalWallets).toBe(2);
      expect(result.totalContracts).toBe(mockContracts.length);
      expect(result.totalDocuments).toBe(mockDocuments.length);
      expect(result.recentContracts[0].address).toBe(getAddress(ADDR_4));
      expect(result.recentDocuments.length).toBe(3);
    });

    it("should handle contracts with no history", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: ADDR_3, history: [] }]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([]);

      const result = await DashboardService.getDashboard();
      expect(result.recentContracts[0].lastAction).toBeNull();
      expect(result.recentContracts[0].createdAt).toBe("0");
    });

    it("should handle documents with null or undefined linkedContracts", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([{ id: "docX", title: null, tokenId: null, owner: null, linkedContracts: undefined, createdAt: 10, updatedAt: 20 }]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);

      const result = await DashboardService.getDashboard();
      expect(result.recentDocuments[0].tokenId).toBe(0);
      expect(result.recentDocuments[0].owner).toBe("");
      expect(result.recentDocuments[0].docType).toBe("Unknown");
      expect(result.recentDocuments[0].status).toBe("Draft");
    });
  });

  // -------------------
  // getUserDashboard tests
  // -------------------
  describe("getUserDashboard", () => {
    it("should return wallets, contracts, documents for the user", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(mockContracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([{ timestamp: 9999 }]);
      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: ADDR_1, importer: ADDR_2, logistics: ADDR_3 });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalWallets).toBe(1);
      expect(result.totalContracts).toBeGreaterThanOrEqual(1);
      expect(result.totalDocuments).toBeGreaterThanOrEqual(1);
    });

    it("should include document linked via contract even if user is not owner", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([{ id: "docLinked", owner: ADDR_3, linkedContracts: [ADDR_4], createdAt: 10, updatedAt: 20 }]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);
      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: ADDR_1, importer: ADDR_2, logistics: ADDR_3 });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalDocuments).toBe(1);
      expect(result.recentDocuments[0].id).toBe("docLinked");
    });

    it("should skip contracts and documents if user has no roles", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: ADDR_3, history: [{ timestamp: 1 }] }]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([{ id: "docSkip", owner: ADDR_4, linkedContracts: [ADDR_3], createdAt: 1, updatedAt: 2 }]);
      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: ADDR_2, importer: ADDR_2, logistics: ADDR_2 });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalContracts).toBe(0);
      expect(result.totalDocuments).toBe(0);
    });

    it("should continue if getContractRoles throws for contracts and documents", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: ADDR_3, history: [{ timestamp: 1 }] }]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([{ id: "docX", owner: ADDR_4, linkedContracts: [ADDR_3], createdAt: 1, updatedAt: 2 }]);

      (getContractRoles as jest.Mock)
        .mockImplementationOnce(() => { throw new Error("contract fail"); })
        .mockImplementationOnce(() => { throw new Error("document fail"); });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalContracts).toBe(0);
      expect(result.totalDocuments).toBe(0);
    });
    
    it("should sort documents correctly even if lastAction is null", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([
        { id: "docA", owner: ADDR_1, linkedContracts: [], createdAt: 100, updatedAt: 200 },
        { id: "docB", owner: ADDR_1, linkedContracts: [], createdAt: 200, updatedAt: 300 },
      ]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]); // lastAction null

      const result = await DashboardService.getUserDashboard(ADDR_1);

      expect(result.recentDocuments[0].id).toBe("docB");
      expect(result.recentDocuments[1].id).toBe("docA");
    });

    it("should throw if userAddress is invalid", async () => {
      await expect(DashboardService.getUserDashboard("0x123")).rejects.toThrow();
    });
  });
});
