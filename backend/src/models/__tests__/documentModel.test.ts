/**
 * @file documentModel.test.ts
 * @description Unit tests for DocumentModel with mocked Firestore.
 */

import { DocumentModel } from "../documentModel";
import type { Document, DocumentLogEntry } from "../../types/Document";

// --- Mock Firestore dependency
jest.mock("../../config/firebase", () => {
  const dataStore: Record<string, any> = {};
  const logsStore: Record<string, any> = {};

  const mockCollectionInstance = {
    filters: [] as ((item: any) => boolean)[],
    doc: jest.fn((id: string) => ({
      id,
      get: jest.fn(async () => ({
        exists: !!dataStore[id] || !!logsStore[id],
        id,
        data: () => dataStore[id] ?? logsStore[id],
      })),
      set: jest.fn(async (data) => {
        if (data.tokenId) dataStore[data.tokenId] = data;
        else logsStore[id] = data;
        return true;
      }),
      update: jest.fn(async (data) => {
        if (dataStore[id]) dataStore[id] = { ...dataStore[id], ...data };
        else logsStore[id] = { ...logsStore[id], ...data };
        return true;
      }),
      delete: jest.fn(async () => {
        if (!dataStore[id]) throw new Error("Document not found");
        delete dataStore[id];
        return true;
      }),
    })),
    where: jest.fn(function (field: string, op: string, value: any) {
      this.filters.push((item: any) => {
        const v = item[field];
        if (op === "==") return v === value;
        if (op === "array-contains") return Array.isArray(v) && v.includes(value);
        return true;
      });
      return this;
    }),
    get: jest.fn(async function () {
      let items = Object.values(dataStore);
      for (const filter of this.filters) items = items.filter(filter);
      return {
        size: items.length,
        empty: items.length === 0,
        docs: items.map(d => ({ id: d.tokenId ?? d.id, data: () => d })),
      };
    }),
    __reset: function () {
      this.filters = [];
    },
  };

  const mockCollection = jest.fn(() => mockCollectionInstance);
  return { db: { collection: mockCollection }, __dataStore: dataStore, __logsStore: logsStore };
});

describe("DocumentModel", () => {
  const makeDoc = (overrides: Partial<Document> = {}): Document => ({
    tokenId: 1,
    owner: "0xowner",
    fileHash: "hash1",
    uri: "uri1",
    docType: "Invoice",
    linkedContracts: ["0xcontract1"],
    status: "Draft",
    createdAt: Date.now(),
    ...overrides,
  });

  const makeLogEntry = (overrides: Partial<DocumentLogEntry> = {}): DocumentLogEntry => ({
    action: "mintDocument",
    txHash: "0x123",
    account: "0xowner",
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    const mockFirebase = jest.requireMock("../../config/firebase");
    for (const key of Object.keys(mockFirebase.__dataStore)) delete mockFirebase.__dataStore[key];
    for (const key of Object.keys(mockFirebase.__logsStore)) delete mockFirebase.__logsStore[key];
    mockFirebase.db.collection().__reset();
  });

  it("should create a new document", async () => {
    const doc = makeDoc();
    const created = await DocumentModel.create(doc);
    expect(created.tokenId).toBe(doc.tokenId);
  });

  it("should throw error if document already exists", async () => {
    const doc = makeDoc();
    await DocumentModel.create(doc);
    await expect(DocumentModel.create(doc)).rejects.toThrow();
  });

  it("should update existing document", async () => {
    const doc = makeDoc();
    await DocumentModel.create(doc);
    const updated = await DocumentModel.update(doc.tokenId, { status: "Signed" });
    expect(updated?.status).toBe("Signed");
  });

  it("should return null when updating non-existing document", async () => {
    const updated = await DocumentModel.update(999, { status: "Signed" });
    expect(updated).toBeNull();
  });

  it("should get document by ID", async () => {
    const doc = makeDoc({ tokenId: 2 });
    await DocumentModel.create(doc);
    const found = await DocumentModel.getById(2);
    expect(found?.tokenId).toBe(2);
  });

  it("should return null for non-existing document ID", async () => {
    const found = await DocumentModel.getById(999);
    expect(found).toBeNull();
  });

  it("should get all documents", async () => {
    await DocumentModel.create(makeDoc({ tokenId: 3 }));
    await DocumentModel.create(makeDoc({ tokenId: 4 }));
    const all = await DocumentModel.getAll();
    expect(all.length).toBe(2);
  });

  it("should get documents by owner", async () => {
    await DocumentModel.create(makeDoc({ tokenId: 5, owner: "userX" }));
    await DocumentModel.create(makeDoc({ tokenId: 6, owner: "userY" }));
    const docs = await DocumentModel.getByOwner("userX");
    expect(docs.length).toBe(1);
    expect(docs[0].owner).toBe("userX");
  });

  it("should get documents by linked contract", async () => {
    await DocumentModel.create(makeDoc({ tokenId: 7, linkedContracts: ["0xABC"] }));
    await DocumentModel.create(makeDoc({ tokenId: 8, linkedContracts: ["0xDEF"] }));
    const docs = await DocumentModel.getByContract("0xABC");
    expect(docs.length).toBe(1);
    expect(docs[0].linkedContracts).toContain("0xABC");
  });

  it("should delete existing document", async () => {
    const doc = makeDoc({ tokenId: 9 });
    await DocumentModel.create(doc);
    const deleted = await DocumentModel.delete(9);
    expect(deleted).toBe(true);
    const found = await DocumentModel.getById(9);
    expect(found).toBeNull();
  });

  it("should return false when deleting non-existing document", async () => {
    const deleted = await DocumentModel.delete(999);
    expect(deleted).toBe(false);
  });

  it("should add log for new document", async () => {
    const log = makeLogEntry();
    await DocumentModel.addLog(10, log);
    const logs = await DocumentModel.getLogs(10);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("mintDocument");
  });

  it("should append log to existing document", async () => {
    const log1 = makeLogEntry({ action: "mintDocument" });
    const log2 = makeLogEntry({ action: "reviewDocument" });
    await DocumentModel.addLog(11, log1);
    await DocumentModel.addLog(11, log2);
    const logs = await DocumentModel.getLogs(11);
    expect(logs.length).toBe(2);
    expect(logs.map(l => l.action)).toContain("reviewDocument");
  });

  it("should return empty array for non-existing document logs", async () => {
    const logs = await DocumentModel.getLogs(999);
    expect(logs).toEqual([]);
  });
});
