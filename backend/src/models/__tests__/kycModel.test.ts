/**
 * @file KYCModel.test.ts
 * @description Unit tests for KYCModel using in-memory Firestore mock.
 */

import { KYCModel } from "../kycModel";
import type { KYC, KYCLogEntry } from "../../types/Kyc";

// --- Mock Firestore dependency
jest.mock("../../config/firebase", () => {
  const dataStore: Record<string, any> = {};
  const logsStore: Record<string, any> = {};

  const mockCollectionInstance = {
    filters: [] as ((item: any) => boolean)[],
    orderField: null as string | null,
    orderDirection: "asc" as "asc" | "desc",
    limitCount: null as number | null,

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
        if (!dataStore[id] && !logsStore[id]) throw new Error("Document not found");
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
        switch (op) {
          case "==": return v === value;
          default: return true;
        }
      });
      return this;
    }),

    get: jest.fn(async function () {
      let items = Object.values(dataStore);

      for (const filter of this.filters) items = items.filter(filter);

      if (this.orderField) {
        items.sort((a, b) => {
          const aVal = a[this.orderField!];
          const bVal = b[this.orderField!];
          if (aVal < bVal) return this.orderDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return this.orderDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount != null) items = items.slice(0, this.limitCount);

      return {
        size: items.length,
        empty: items.length === 0,
        docs: items.map(d => ({ id: d.tokenId ?? d.id, data: () => d })),
      };
    }),

    __reset: function () {
      this.filters = [];
      this.orderField = null;
      this.orderDirection = "asc";
      this.limitCount = null;
    },
  };

  const mockCollection = jest.fn(() => mockCollectionInstance);
  return { db: { collection: mockCollection }, __dataStore: dataStore, __logsStore: logsStore };
});

describe("KYCModel", () => {
  const makeKyc = (overrides: Partial<KYC> = {}): KYC => ({
    tokenId: "kyc1",
    owner: "0xabc",
    fileHash: "hash1",
    metadataUrl: "url1",
    status: "Draft",
    createdAt: Date.now(),
    ...overrides,
  });

  const makeLogEntry = (overrides: Partial<KYCLogEntry> = {}): KYCLogEntry => ({
    action: "mintKYC",
    txHash: "0x123",
    account: "0xabc",
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    const mockFirebase = jest.requireMock("../../config/firebase");
    for (const key of Object.keys(mockFirebase.__dataStore)) delete mockFirebase.__dataStore[key];
    for (const key of Object.keys(mockFirebase.__logsStore)) delete mockFirebase.__logsStore[key];
    mockFirebase.db.collection().__reset();
  });

  it("should create a new KYC record", async () => {
    const kyc = makeKyc();
    const created = await KYCModel.create(kyc);
    expect(created).toMatchObject({ tokenId: "kyc1", owner: "0xabc" });
  });

  it("should update existing KYC record", async () => {
    const kyc = makeKyc();
    await KYCModel.create(kyc);
    const updated = await KYCModel.update("kyc1", { status: "Reviewed" });
    expect(updated?.status).toBe("Reviewed");
  });

  it("should return null when updating non-existing KYC", async () => {
    const updated = await KYCModel.update("nope", { status: "Signed" });
    expect(updated).toBeNull();
  });

  it("should get KYC by ID", async () => {
    const kyc = makeKyc({ tokenId: "kyc2" });
    await KYCModel.create(kyc);
    const found = await KYCModel.getById("kyc2");
    expect(found?.tokenId).toBe("kyc2");
  });

  it("should return null for non-existing KYC ID", async () => {
    const found = await KYCModel.getById("nonexistent");
    expect(found).toBeNull();
  });

  it("should get all KYC records", async () => {
    await KYCModel.create(makeKyc({ tokenId: "kyc3" }));
    await KYCModel.create(makeKyc({ tokenId: "kyc4" }));
    const all = await KYCModel.getAll();
    expect(all.length).toBe(2);
  });

  it("should get KYC by owner", async () => {
    await KYCModel.create(makeKyc({ tokenId: "kyc5", owner: "userX" }));
    await KYCModel.create(makeKyc({ tokenId: "kyc6", owner: "userY" }));
    const kycs = await KYCModel.getByOwner("userX");
    expect(kycs.length).toBe(1);
    expect(kycs[0].owner).toBe("userX");
  });

  it("should delete KYC record", async () => {
    const kyc = makeKyc({ tokenId: "kyc7" });
    await KYCModel.create(kyc);
    const deleted = await KYCModel.delete("kyc7");
    expect(deleted?.tokenId).toBe("kyc7");
    const found = await KYCModel.getById("kyc7");
    expect(found).toBeNull();
  });

  it("should return null when deleting non-existing KYC", async () => {
    const deleted = await KYCModel.delete("nope");
    expect(deleted).toBeNull();
  });

  it("should add log to new KYC", async () => {
    const entry = makeLogEntry();
    await KYCModel.addLog("kyc8", entry);
    const logs = await KYCModel.getLogs("kyc8");
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("mintKYC");
  });

  it("should append log to existing KYC", async () => {
    const entry1 = makeLogEntry({ action: "mintKYC" });
    const entry2 = makeLogEntry({ action: "reviewKYC" });
    await KYCModel.addLog("kyc9", entry1);
    await KYCModel.addLog("kyc9", entry2);
    const logs = await KYCModel.getLogs("kyc9");
    expect(logs.length).toBe(2);
    expect(logs.map(l => l.action)).toContain("reviewKYC");
  });

  it("should return empty array for non-existing KYC logs", async () => {
    const logs = await KYCModel.getLogs("nope");
    expect(logs).toEqual([]);
  });
});
