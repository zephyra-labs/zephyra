/**
 * @file dashboardService.test.ts
 * @description Full branch coverage tests for DashboardService (refactored)
 */

import { DashboardService } from "../dashboardService";
import { DashboardModel } from "../../models/dashboardModel";
import { getContractRoles } from "../../utils/getContractRoles";
import { getAddress } from "viem";

jest.mock("../../models/dashboardModel");
jest.mock("../../utils/getContractRoles");

const ADDR_1 = "0x1111111111111111111111111111111111111111";
const ADDR_2 = "0x2222222222222222222222222222222222222222";
const ADDR_3 = "0x3333333333333333333333333333333333333333";

describe("DashboardService", () => {
  const mockUsers = [
    { address: ADDR_1, balance: 100 },
    { address: ADDR_2, balance: 200 },
    { address: null, balance: 0 },
  ];

  const mockContracts = [
    { id: ADDR_3, history: [{ timestamp: 1000 }] },
    { id: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", history: [] },
  ];

  const mockDocuments = [
    { id: "doc1", title: "Doc 1", tokenId: "1", owner: ADDR_1, docType: "TypeA", status: "Draft", createdAt: 100, updatedAt: 200, linkedContracts: [ADDR_3] },
    { id: "doc2", title: "Doc 2", tokenId: "2", owner: ADDR_2, docType: "TypeB", status: "Final", createdAt: 150, updatedAt: 250, linkedContracts: [] },
    { id: "doc3", title: null, tokenId: null, owner: null, docType: null, status: null, createdAt: 50, updatedAt: 60, linkedContracts: null },
  ];

  beforeEach(() => jest.clearAllMocks());

  // -------------------
  // getDashboard
  // -------------------
  describe("getDashboard", () => {
    it("aggregates wallets, contracts, and documents with sorting", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(mockContracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([{ timestamp: 5000 }]);

      const result = await DashboardService.getDashboard();

      expect(result.totalWallets).toBe(2);
      expect(result.totalContracts).toBe(mockContracts.length);
      expect(result.totalDocuments).toBe(mockDocuments.length);
      expect(result.recentContracts[0].address).toBe(getAddress(mockContracts[0].id));
      expect(result.recentDocuments.length).toBe(3);
    });

    it("handles contracts with empty history", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: ADDR_3, history: [] }]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([]);

      const result = await DashboardService.getDashboard();
      expect(result.recentContracts[0].lastAction).toEqual({ action: "", timestamp: 0 });
      expect(result.recentContracts[0].createdAt).toBe("0");
    });

    it("handles documents with null fields and missing linkedContracts", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([
        { id: "docX", title: null, tokenId: null, owner: null, linkedContracts: undefined, createdAt: 10, updatedAt: 20 }
      ]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);

      const doc = (await DashboardService.getDashboard()).recentDocuments[0];
      expect(doc.tokenId).toBe(0);
      expect(doc.owner).toBe("");
      expect(doc.docType).toBe("Unknown");
      expect(doc.status).toBe("Draft");
    });

    it("defaults wallet balance to 0 if null", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([{ address: ADDR_1, balance: null }]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([]);

      const wallet = (await DashboardService.getDashboard()).wallets[0];
      expect(wallet.balance).toBe(0);
    });
    
    it("applies updatedAt fallback correctly in recentDocuments", async () => {
      const mockDocs = [
        { id: "doc1", title: "Doc1", owner: ADDR_1, docType: "TypeA", status: "Draft", createdAt: 10, updatedAt: 50 },
        { id: "doc2", title: "Doc2", owner: ADDR_2, docType: "TypeB", status: "Final", createdAt: 20, updatedAt: null },
        { id: "doc3", title: "Doc3", owner: ADDR_3, docType: "TypeC", status: "Draft", createdAt: 30, updatedAt: undefined },
      ];

      const logs: Record<string, { action: string; timestamp: number }[]> = {
        doc1: [],
        doc2: [],
        doc3: [],
      };

      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(mockDocs);
      (DashboardModel.getDocumentLogs as jest.Mock).mockImplementation((id: string) => logs[id] || []);

      const result = await DashboardService.getDashboard();

      const docsById = result.recentDocuments.reduce((acc, d) => {
        acc[d.id] = d;
        return acc;
      }, {} as Record<string, any>);

      expect(docsById["doc1"].updatedAt).toBe(50);
      expect(docsById["doc2"].updatedAt).toBe(0);
      expect(docsById["doc3"].updatedAt).toBe(0);
    });
    
    it("sorts documents by lastAction.timestamp or createdAt with fallback and limits to 5", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([{ address: ADDR_1, balance: 50 }]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      
      const docs = [
        { id: "doc1", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: 0 },
        { id: "doc2", owner: ADDR_1, linkedContracts: [], createdAt: 100, updatedAt: 0 },
        { id: "doc3", owner: ADDR_1, linkedContracts: [], createdAt: 50, updatedAt: 0 },
        { id: "doc4", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: 0 },
        { id: "doc5", owner: ADDR_1, linkedContracts: [], createdAt: 200, updatedAt: 0 },
        { id: "doc6", owner: ADDR_1, linkedContracts: [], createdAt: 150, updatedAt: 0 },
      ];
      
      const logs: Record<string, { action: string; timestamp: number }[]> = {
        doc1: [],
        doc2: [{ action: "a", timestamp: 120 }],
        doc3: [],
        doc4: [],
        doc5: [{ action: "b", timestamp: 180 }],
        doc6: [{ action: "c", timestamp: 160 }],
      };

      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(docs);
      (DashboardModel.getDocumentLogs as jest.Mock).mockImplementation((id: string) => logs[id] || []);

      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: "", importer: "", logistics: "" });

      const dashboard = await DashboardService.getDashboard();

      const sortedIds = dashboard.recentDocuments.map(d => d.id);
      expect(sortedIds).toEqual(["doc5", "doc6", "doc2", "doc3", "doc1"]);
    });
  });

  // -------------------
  // getUserDashboard
  // -------------------
  describe("getUserDashboard", () => {
    const setupMocks = ({
      users = [] as Array<{ address: string | null; balance: number | null }>,
      contracts = [] as Array<any>,
      documents = [] as Array<any>,
      roles = { exporter: "", importer: "", logistics: "" },
    } = {}) => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue(users);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue(contracts);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(documents);
      (getContractRoles as jest.Mock).mockResolvedValue(roles);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);
    };

    it("throws on invalid address", async () => {
      await expect(DashboardService.getUserDashboard("0x123")).rejects.toThrow();
    });

    it("returns user wallets", async () => {
      setupMocks({ users: mockUsers });
      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalWallets).toBe(1);
    });

    it("includes contracts where user has roles", async () => {
      setupMocks({ contracts: [{ id: ADDR_3, history: [{ timestamp: 100 }] }], roles: { exporter: ADDR_1, importer: "", logistics: "" } });
      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalContracts).toBe(1);
      expect(result.recentContracts[0].address).toBe(getAddress(ADDR_3));
    });

    it("includes documents owned by user", async () => {
      setupMocks({ documents: [mockDocuments[0]] });
      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalDocuments).toBe(1);
      expect(result.recentDocuments[0].id).toBe("doc1");
    });

    it("includes documents linked via contract roles", async () => {
      setupMocks({ documents: [{ id: "docLinked", owner: ADDR_2, linkedContracts: [ADDR_3], createdAt: 10, updatedAt: 20 }] });
      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: ADDR_1, importer: "", logistics: "" });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalDocuments).toBe(1);
      expect(result.recentDocuments[0].id).toBe("docLinked");
    });

    it("skips contracts/documents if user has no roles", async () => {
      setupMocks({
        contracts: [{ id: ADDR_3, history: [{ timestamp: 1 }] }],
        documents: [{ id: "docSkip", owner: ADDR_2, linkedContracts: [ADDR_3], createdAt: 1, updatedAt: 2 }],
        roles: { exporter: ADDR_2, importer: ADDR_2, logistics: ADDR_2 },
      });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalContracts).toBe(0);
      expect(result.totalDocuments).toBe(0);
    });

    it("handles getContractRoles throwing errors gracefully", async () => {
      setupMocks({
        contracts: [{ id: ADDR_3, history: [{ timestamp: 1 }] }],
        documents: [{ id: "docX", owner: ADDR_2, linkedContracts: [ADDR_3], createdAt: 1, updatedAt: 2 }],
      });
      (getContractRoles as jest.Mock).mockImplementation(() => { throw new Error("fail"); });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      expect(result.totalContracts).toBe(0);
      expect(result.totalDocuments).toBe(0);
    });

    it("sorts documents and contracts correctly using lastAction or createdAt", async () => {
      setupMocks({
        users: [{ address: ADDR_1, balance: 100 }],
        contracts: [
          { id: ADDR_1, history: [{ timestamp: 50 }] },
          { id: ADDR_2, history: [] },
          { id: ADDR_3, history: [{ timestamp: 100 }] },
        ],
        documents: [
          { id: "doc1", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: undefined },
          { id: "doc2", owner: ADDR_1, linkedContracts: [], createdAt: 50, updatedAt: 60 }
        ],
      });

      (getContractRoles as jest.Mock).mockImplementation(async (id: string) => {
        if (id === ADDR_1) return { exporter: ADDR_1, importer: "", logistics: "" };
        if (id === ADDR_2) return { exporter: ADDR_1, importer: "", logistics: "" };
        return { exporter: "", importer: "", logistics: "" };
      });

      const result = await DashboardService.getUserDashboard(ADDR_1);

      // Contracts sorted descending by lastAction.timestamp or fallback to 0
      const contractAddresses = result.recentContracts.map(c => c.address);
      expect(contractAddresses).toEqual([getAddress(ADDR_1), getAddress(ADDR_2)]);

      // Documents sorted descending by lastAction.timestamp || createdAt
      const [firstDoc, secondDoc] = result.recentDocuments;
      expect(firstDoc.id).toBe("doc2");
      expect(secondDoc.id).toBe("doc1");

      // fallback values
      expect(secondDoc.createdAt).toBe(0);
      expect(secondDoc.updatedAt).toBe(0);
      expect(result.wallets[0].balance).toBe(100);
    });

    it("handles linkedContracts mapping and user role fallback", async () => {
      setupMocks({
        documents: [{ id: "docLinked", owner: ADDR_2, linkedContracts: [ADDR_3], createdAt: 10, updatedAt: 20 }],
      });
      (getContractRoles as jest.Mock).mockImplementation(async (id: string) => id === ADDR_3 ? { exporter: ADDR_1, importer: "", logistics: "" } : { exporter: "", importer: "", logistics: "" });

      const result = await DashboardService.getUserDashboard(ADDR_1);
      const doc = result.recentDocuments[0];

      expect(doc.owner).toBe(ADDR_2);
      expect(doc.createdAt).toBe(10);
      expect(doc.updatedAt).toBe(20);
    });
    
    it("handles wallets with null balance and documents with null owner or linkedContracts", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([{ address: ADDR_1, balance: null }]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([
        { id: "docNull", tokenId: null, owner: null, linkedContracts: undefined, createdAt: null, updatedAt: undefined }
      ]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);

      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: "", importer: "", logistics: "" });

      const dashboard = await DashboardService.getUserDashboard(ADDR_1);

      const wallet = dashboard.wallets[0];
      expect(wallet.balance).toBe(0);

      const doc = dashboard.recentDocuments[0];
      expect(doc.owner).toBe("");
      expect(doc.tokenId).toBe(0);
      expect(doc.createdAt).toBe(0);
      expect(doc.updatedAt).toBe(0);
    });

    it("sorts documents using lastAction.timestamp or createdAt fallback", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([{ address: ADDR_1, balance: 50 }]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue([
        { id: "doc1", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: undefined },
        { id: "doc2", owner: ADDR_1, linkedContracts: [], createdAt: 100, updatedAt: 200 },
      ]);
      (DashboardModel.getDocumentLogs as jest.Mock).mockResolvedValue([]);

      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: "", importer: "", logistics: "" });

      const dashboard = await DashboardService.getUserDashboard(ADDR_1);
      const [firstDoc, secondDoc] = dashboard.recentDocuments;

      expect(firstDoc.id).toBe("doc2");
      expect(secondDoc.id).toBe("doc1");
      expect(secondDoc.createdAt).toBe(0);
      expect(secondDoc.updatedAt).toBe(0);
    });
    
    it("sorts documents by lastAction.timestamp or createdAt with fallback and limits to 5", async () => {
      (DashboardModel.getAllUsers as jest.Mock).mockResolvedValue([{ address: ADDR_1, balance: 50 }]);
      (DashboardModel.getAllContracts as jest.Mock).mockResolvedValue([]);
      
      const docs = [
        { id: "doc1", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: 0 },
        { id: "doc2", owner: ADDR_1, linkedContracts: [], createdAt: 100, updatedAt: 0 },
        { id: "doc3", owner: ADDR_1, linkedContracts: [], createdAt: 50, updatedAt: 0 },
        { id: "doc4", owner: ADDR_1, linkedContracts: [], createdAt: null, updatedAt: 0 },
        { id: "doc5", owner: ADDR_1, linkedContracts: [], createdAt: 200, updatedAt: 0 },
        { id: "doc6", owner: ADDR_1, linkedContracts: [], createdAt: 150, updatedAt: 0 },
      ];
      
      const logs: Record<string, { action: string; timestamp: number }[]> = {
        doc1: [],
        doc2: [{ action: "a", timestamp: 120 }],
        doc3: [],
        doc4: [],
        doc5: [{ action: "b", timestamp: 180 }],
        doc6: [{ action: "c", timestamp: 160 }],
      };

      (DashboardModel.getAllDocuments as jest.Mock).mockResolvedValue(docs);
      (DashboardModel.getDocumentLogs as jest.Mock).mockImplementation((id: string) => logs[id] || []);

      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: "", importer: "", logistics: "" });

      const dashboard = await DashboardService.getUserDashboard(ADDR_1);

      const sortedIds = dashboard.recentDocuments.map(d => d.id);
      expect(sortedIds).toEqual(["doc5", "doc6", "doc2", "doc3", "doc1"]);
    });
  });
});
