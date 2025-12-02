/**
 * @file TradeModel.test.ts
 * @description Fully mocked unit tests for TradeModel using Jest + in-memory Firestore mock.
 */

import { TradeModel } from "../tradeModel";
import type { TradeRecord, TradeParticipant, TradeStatus } from "../../types/Trade";

// --- Mock Firestore dependency
jest.mock("../../config/firebase", () => {
  const dataStore: Record<string, any> = {};
  let idCounter = 1;

  const mockCollectionInstance = {
    filters: [] as ((item: any) => boolean)[],
    orderField: null as string | null,
    orderDirection: "asc" as "asc" | "desc",
    limitCount: null as number | null,
    offsetCount: null as number | null,

    add: jest.fn(async (data) => {
      const id = "trade" + idCounter++;
      dataStore[id] = { id, ...data };
      return { id };
    }),

    doc: jest.fn((id: string) => ({
      id,
      get: jest.fn(async () => ({
        exists: !!dataStore[id],
        id,
        data: () => dataStore[id],
      })),
      set: jest.fn(async (data) => {
        dataStore[id] = { id, ...data };
        return true;
      }),
      update: jest.fn(async (data) => {
        if (!dataStore[id]) throw new Error("TradeRecord not found");
        dataStore[id] = { ...dataStore[id], ...data };
        return true;
      }),
      delete: jest.fn(async () => {
        if (!dataStore[id]) throw new Error("TradeRecord not found");
        delete dataStore[id];
        return true;
      }),
    })),

    batch: jest.fn(() => {
      const ops: (() => Promise<any>)[] = [];
      return {
        delete: (docRef: any) => {
          ops.push(() => {
            if (!dataStore[docRef.id]) throw new Error("not found");
            delete dataStore[docRef.id];
            return Promise.resolve();
          });
        },
        commit: jest.fn(async () => {
          for (const op of ops) await op();
        }),
      };
    }),

    where: jest.fn(function (field: string, op: string, value: any) {
      this.filters.push((item: any) => {
        const v = item[field];
        switch (op) {
          case "==": return v === value;
          case ">=": return v >= value;
          case "<=": return v <= value;
          case ">": return v > value;
          case "<": return v < value;
          default: return true;
        }
      });
      return this;
    }),

    orderBy: jest.fn(function (field: string, dir?: "asc" | "desc") {
      this.orderField = field;
      if (dir) this.orderDirection = dir;
      return this;
    }),

    limit: jest.fn(function (count: number) {
      this.limitCount = count;
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

      if (this.offsetCount) items = items.slice(this.offsetCount);
      if (this.limitCount != null) items = items.slice(0, this.limitCount);

      return {
        size: items.length,
        empty: items.length === 0,
        docs: items.map(d => ({ id: d.id, data: () => d })),
      };
    }),

    __reset: function () {
      this.filters = [];
      this.orderField = null;
      this.orderDirection = "asc";
      this.limitCount = null;
      this.offsetCount = null;
    },
  };

  const mockCollection = jest.fn(() => mockCollectionInstance);
  return { db: { collection: mockCollection }, __dataStore: dataStore };
});

// ------------------------- TESTS -------------------------
describe("TradeModel - core operations", () => {
  const now = Date.now();
  const mockTrade: TradeRecord = {
    id: "trade1",
    participants: [
      { address: "0x123", role: "exporter", kycVerified: true, walletConnected: true },
      { address: "0x456", role: "importer", kycVerified: false, walletConnected: false },
    ],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    const mockFirebase = jest.requireMock("../../config/firebase");
    Object.keys(mockFirebase.__dataStore).forEach(k => delete mockFirebase.__dataStore[k]);
    mockFirebase.db.collection().__reset();
  });

  it("should upsert a new trade record", async () => {
    await TradeModel.upsertTradeRecord(mockTrade);
    const record = await TradeModel.getTradeById("trade1");
    expect(record).not.toBeNull();
    expect(record?.participants.length).toBe(2);
  });

  it("should update an existing trade record via upsertTradeRecord", async () => {
    const existingTrade = { ...mockTrade, id: "trade_existing" };
    await TradeModel.upsertTradeRecord(existingTrade);
    await TradeModel.upsertTradeRecord({ ...existingTrade, status: "inProgress" });
    const record = await TradeModel.getTradeById("trade_existing");
    expect(record?.status).toBe("inProgress");
  });

  it("should update trade status", async () => {
    await TradeModel.upsertTradeRecord(mockTrade);
    await TradeModel.updateTradeStatus("trade1", "completed");
    const record = await TradeModel.getTradeById("trade1");
    expect(record?.status).toBe("completed");
  });

  it("should update participant role", async () => {
    await TradeModel.upsertTradeRecord(mockTrade);
    const updatedParticipants = await TradeModel.updateParticipantRole("trade1", "0x123", "importer");
    const record = await TradeModel.getTradeById("trade1");
    expect(updatedParticipants.find(p => p.address === "0x123")?.role).toBe("importer");
    expect(record?.participants.find(p => p.address === "0x123")?.role).toBe("importer");
  });

  it("should get all trades", async () => {
    await TradeModel.upsertTradeRecord(mockTrade);
    const trades = await TradeModel.getAllTrades();
    expect(trades.length).toBeGreaterThan(0);
  });

  it("should get trades by participant", async () => {
    await TradeModel.upsertTradeRecord(mockTrade);
    const trades = await TradeModel.getTradesByParticipant("0x123");
    expect(trades.length).toBeGreaterThan(0);
    expect(trades[0].participants.map(p => p.address)).toContain("0x123");
  });

  it("should throw error when updating non-existing trade", async () => {
    await expect(TradeModel.updateParticipantRole("nonexistent", "0x123", "exporter"))
      .rejects.toThrow("TradeRecord not found");

    await expect(TradeModel.updateTradeStatus("nonexistent", "completed"))
      .rejects.toThrow("TradeRecord not found");
  });
});

// ------------------------- EDGE CASES -------------------------
describe("TradeModel - edge cases", () => {
  it("should set updatedAt to null if missing when creating a new trade", async () => {
    const trade: TradeRecord = { id: "trade_no_updatedAt", participants: [], status: "draft", createdAt: Date.now() };
    await TradeModel.upsertTradeRecord(trade);
    const stored = await TradeModel.getTradeById("trade_no_updatedAt");
    expect(stored).not.toBeNull();
    expect(stored?.updatedAt).toBeNull();
  });

  it("should overwrite updatedAt when upserting existing trade", async () => {
    const trade: TradeRecord = { id: "trade_old", participants: [], status: "draft", createdAt: Date.now(), updatedAt: 12345 };
    await TradeModel.upsertTradeRecord(trade);
    await TradeModel.upsertTradeRecord({ ...trade, status: "inProgress" });
    const stored = await TradeModel.getTradeById("trade_old");
    expect(stored?.status).toBe("inProgress");
    expect(stored?.updatedAt).not.toBe(12345);
  });

  it("getTradeById should return null if trade does not exist", async () => {
    const record = await TradeModel.getTradeById("nonexistent");
    expect(record).toBeNull();
  });

  it("getTradeById should return trade if it exists", async () => {
    const trade: TradeRecord = { id: "trade_exists", participants: [], status: "draft", createdAt: Date.now(), updatedAt: Date.now() };
    await TradeModel.upsertTradeRecord(trade);
    const record = await TradeModel.getTradeById("trade_exists");
    expect(record).not.toBeNull();
    expect(record?.id).toBe("trade_exists");
  });
});
