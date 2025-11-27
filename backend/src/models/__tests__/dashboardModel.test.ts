/**
 * @file dashboardModel.test.ts
 * @description Unit tests for DashboardModel with mocked Firestore.
 */

import { DashboardModel } from "../dashboardModel";
import type { DocumentLogEntry } from "../../types/Document";

// --- Mock Firestore dependency
jest.mock("../../config/firebase", () => {
  const usersStore: Record<string, any> = {};
  const contractsStore: Record<string, any> = {};
  const documentsStore: Record<string, any> = {};
  const documentLogsStore: Record<string, any> = {};

  const makeCollection = (store: Record<string, any>) => ({
    doc: jest.fn((id: string) => ({
      id,
      get: jest.fn(async () => ({
        exists: !!store[id],
        data: () => store[id],
      })),
    })),
    get: jest.fn(async () => ({
      docs: Object.entries(store).map(([id, data]) => ({
        id,
        data: () => data,
      })),
    })),
    __store: store,
    __reset: function () {
      for (const key of Object.keys(store)) delete store[key];
    },
  });

  return {
    db: {
      collection: (name: string) => {
        switch (name) {
          case "users":
            return makeCollection(usersStore);
          case "contractLogs":
            return makeCollection(contractsStore);
          case "documents":
            return makeCollection(documentsStore);
          case "documentLogs":
            return makeCollection(documentLogsStore);
          default:
            return makeCollection({});
        }
      },
      __stores: { usersStore, contractsStore, documentsStore, documentLogsStore },
    },
  };
});

describe("DashboardModel", () => {
  const mockFirebase = jest.requireMock("../../config/firebase");

  beforeEach(() => {
    for (const store of Object.values(mockFirebase.db.__stores) as Record<string, any>[]) {
        for (const key of Object.keys(store)) delete store[key];
    }
  });

  it("should get all users", async () => {
    mockFirebase.db.__stores.usersStore["u1"] = { address: "0xabc", balance: 100 };
    mockFirebase.db.__stores.usersStore["u2"] = { address: "0xdef" };

    const users = await DashboardModel.getAllUsers();
    expect(users.length).toBe(2);
    expect(users.map(u => u.id)).toEqual(["u1", "u2"]);
    expect(users.find(u => u.id === "u1")?.balance).toBe(100);
  });

  it("should get all contracts", async () => {
    mockFirebase.db.__stores.contractsStore["c1"] = { history: [{ txHash: "0x1" }] };
    const contracts = await DashboardModel.getAllContracts();
    expect(contracts.length).toBe(1);
    expect(contracts[0].id).toBe("c1");
    expect(contracts[0].history?.[0].txHash).toBe("0x1");
  });

  it("should get all documents", async () => {
    mockFirebase.db.__stores.documentsStore["d1"] = {
      tokenId: 1,
      owner: "0xowner",
      docType: "Invoice",
      status: "Draft",
      createdAt: Date.now(),
      linkedContracts: ["0xcontract1"],
      title: "My Document",
    };
    const docs = await DashboardModel.getAllDocuments();
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe("d1");
    expect(docs[0].title).toBe("My Document");
  });

  it("should get document logs", async () => {
    const logEntry: DocumentLogEntry = {
      action: "mintDocument",
      txHash: "0x123",
      account: "0xowner",
      timestamp: Date.now(),
    };
    mockFirebase.db.__stores.documentLogsStore["d1"] = { tokenId: 1, contractAddress: "0xc", history: [logEntry] };

    const logs = await DashboardModel.getDocumentLogs("d1");
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("mintDocument");
  });

  it("should return empty array for non-existing document logs", async () => {
    const logs = await DashboardModel.getDocumentLogs("nonexist");
    expect(logs).toEqual([]);
  });
  
  it('should return empty array if document logs exist but history is missing', async () => {
    const tokenId = 'noHistory';
    mockFirebase.db.__stores.documentLogsStore[tokenId] = { tokenId: 999, contractAddress: "0xabc" };

    const logs = await DashboardModel.getDocumentLogs(tokenId);
    expect(logs).toEqual([]);
  });
});
