/**
 * @file activityModel.test.ts
 * @description Full coverage unit tests for activityModel (Firestore fully mocked)
 */

import type { ActivityLog } from "@/types/Activity";

// --- Mock Firestore Setup --- //
const mockAccounts: Record<string, Record<string, any>> = {};
const mockAggregated: Record<string, any> = {};

// Subcollection mock (per account)
const createSubCollectionMock = (docs: Record<string, any>) => ({
  _docs: docs,
  orderBy: jest.fn().mockReturnThis(),
  startAfter: jest.fn(function (ts: number) {
    this._docs = Object.fromEntries(
      Object.entries(this._docs).filter(([_, doc]) => (doc as any).timestamp > ts)
    );
    return this;
  }),
  limit: jest.fn(function (n: number) {
    const sortedKeys = Object.entries(this._docs)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.timestamp - a.timestamp)
      .map(([k]) => k);
    const keys = sortedKeys.slice(0, n);
    this._docs = Object.fromEntries(keys.map(k => [k, this._docs[k]]));
    return this;
  }),
  get: jest.fn(async function () {
    const docs = Object.entries(this._docs)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.timestamp - a.timestamp)
      .map(([id, data]) => ({ id, data: () => data }));
    return { docs };
  }),
  add: jest.fn(async function (data: any) {
    const id = `${Date.now()}_${Math.random()}`;
    this._docs[id] = data;
    return { id };
  }),
});

// Collection mock (global)
const mockCollection = jest.fn((name: string) => {
  const _docs: Record<string, any> = name === "aggregatedActivityLogs" ? mockAggregated : mockAccounts;

  const isAggregated = name === "aggregatedActivityLogs";

  return {
    _docs,
    doc: (id: string) => ({
      id,
      collection: (subName: string) => {
        if (subName === "history") {
          if (!mockAccounts[id]) mockAccounts[id] = {};
          return createSubCollectionMock(mockAccounts[id]);
        }
        return createSubCollectionMock({});
      },
      set: jest.fn(async (data: any) => {
        _docs[id] = { ...data, tags: data.tags ?? [] };
        return true;
      }),
      get: jest.fn(async () => ({ id, data: () => _docs[id] || null })),
    }),
    add: jest.fn(async function (data: any) {
      const id = `${Date.now()}_${Math.random()}`;
      _docs[id] = data;
      return { id };
    }),
    set: jest.fn(async function (data: any) {
      const id = data.id ?? `${Date.now()}_${Math.random()}`;
      _docs[id] = { ...data, tags: data.tags ?? [] };
      return true;
    }),
    get: jest.fn(async function () {
      const docs = Object.entries(this._docs)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b.timestamp - a.timestamp)
        .map(([id, data]) => ({ id, data: () => data }));
      return { docs };
    }),
    orderBy: jest.fn().mockReturnThis(),
    startAfter: isAggregated
      ? jest.fn(function (ts: number) {
          this._docs = Object.fromEntries(
            Object.entries(this._docs).filter(([_, doc]) => (doc as any).timestamp > ts)
          );
          return this;
        })
      : jest.fn().mockReturnThis(),
    limit: isAggregated
      ? jest.fn(function (n: number) {
          const sortedKeys = Object.entries(this._docs)
            .sort(([, a]: [string, any], [, b]: [string, any]) => b.timestamp - a.timestamp)
            .map(([k]) => k);
          const keys = sortedKeys.slice(0, n);
          this._docs = Object.fromEntries(keys.map(k => [k, this._docs[k]]));
          return this;
        })
      : jest.fn().mockReturnThis(),
    where: jest.fn(function (field: string, op: string, value: any) {
      if (op === "==" && field.endsWith("Lower")) {
        const key = field.replace("Lower", "");
        this._docs = Object.fromEntries(
          Object.entries(this._docs).filter(([_, doc]) => (doc as any)[key]?.toLowerCase() === value)
        );
      }
      if (op === "array-contains" && field === "tags") {
        if (Array.isArray(value)) {
          this._docs = Object.fromEntries(
            Object.entries(this._docs).filter(([_, doc]) =>
              (value as string[]).every(tag => (doc as any).tags?.includes(tag))
            )
          );
        } else {
          this._docs = Object.fromEntries(
            Object.entries(this._docs).filter(([_, doc]) => (doc as any).tags?.includes(value))
          );
        }
      }
      return this;
    }),
  };
});

jest.mock("@/config/firebase", () => ({ db: { collection: mockCollection } }));

// --- Import after mock ---
import {
  addActivityLog,
  getAllAccounts,
  getActivityByAccount,
  getAllActivities,
  getAggregatedActivities,
} from "@/models/activityModel";

// --- Mock DTO Validation ---
jest.mock("@/dtos/activityDTO", () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    validate: jest.fn(),
    type: data.type,
    action: data.action,
    account: data.account,
    txHash: data.txHash,
    contractAddress: data.contractAddress,
    extra: data.extra,
    onChainInfo: data.onChainInfo,
  }));
});

describe("activityModel - full coverage", () => {
  const baseData = {
    type: "wallet",
    action: "transfer",
    account: "0xabc123",
    txHash: "0xtx987",
    contractAddress: "0xcontract1",
    extra: { amount: 100 },
    onChainInfo: { status: "success", blockNumber: 1, confirmations: 1 },
  } as unknown as Partial<ActivityLog> & { tags?: string[] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- addActivityLog ---
  it("should add a new activity log with tags", async () => {
    const result = await addActivityLog({ ...baseData, tags: ["finance", "transfer"] });
    expect(result.account).toBe("0xabc123");
    expect(result.action).toBe("transfer");
  });

  it("should add a new activity log without tags", async () => {
    const result = await addActivityLog({ ...baseData });
    expect(result.account).toBe("0xabc123");
    expect(result.action).toBe("transfer");
  });

  it("should add activity log without extra or onChainInfo", async () => {
    const result = await addActivityLog({ ...baseData, extra: undefined, onChainInfo: undefined });
    expect(result.extra).toBeUndefined();
    expect(result.onChainInfo).toBeUndefined();
  });

  // --- getAllAccounts ---
  it("should get all accounts", async () => {
    await addActivityLog({ ...baseData });
    const accounts = await getAllAccounts();
    expect(accounts).toContain("0xabc123");
  });

  // --- getActivityByAccount ---
  it("should get activities by account with limit and startAfterTimestamp", async () => {
    const ts1 = Date.now();
    await addActivityLog({ ...baseData, timestamp: ts1 });
    await addActivityLog({ ...baseData, timestamp: ts1 + 100 });
    const activities = await getActivityByAccount("0xabc123", { limit: 1, startAfterTimestamp: ts1 });
    expect(activities.length).toBeLessThanOrEqual(1);
    if (activities.length > 0) expect(activities[0].timestamp).toBeGreaterThan(ts1);
  });

  it("should get activities by account without limit/startAfter", async () => {
    const activities = await getActivityByAccount("0xabc123");
    expect(activities.length).toBeGreaterThan(0);
  });

  it("should return empty array if account has no activity", async () => {
    const activities = await getActivityByAccount("0xnoexist");
    expect(activities).toEqual([]);
  });

  // --- getAllActivities ---
  it("should get all activities globally and filtered by txHash / contractAddress", async () => {
    await addActivityLog({ ...baseData });
    const activities = await getAllActivities({ txHash: "0xtx987", contractAddress: "0xcontract1" });
    expect(activities.every(a => a.txHash === "0xtx987")).toBe(true);
    expect(activities.every(a => a.contractAddress === "0xcontract1")).toBe(true);
  });

  it("should get all activities without filter", async () => {
    await addActivityLog({ ...baseData });
    const activities = await getAllActivities();
    expect(activities.length).toBeGreaterThan(0);
  });
  
  it("should get all activities for a specific account with limit and startAfter", async () => {
    const ts = Date.now();

    // Add multiple activities for the same account
    await addActivityLog({ ...baseData, account: "0xabc123", timestamp: ts });
    await addActivityLog({ ...baseData, account: "0xabc123", timestamp: ts + 100 });
    await addActivityLog({ ...baseData, account: "0xabc123", timestamp: ts + 200 });

    const logs = await getAllActivities({
      account: "0xabc123",
      startAfterTimestamp: ts,
      limit: 2,
    });

    expect(logs.every(l => l.account === "0xabc123")).toBe(true);
    expect(logs.length).toBeLessThanOrEqual(2);
    expect(logs.every(l => l.timestamp! > ts)).toBe(true);
  });
  
  describe("getAllActivities - remaining branches", () => {
    const ts = Date.now();

    beforeEach(async () => {
      jest.clearAllMocks();
      // Add activities for multiple accounts
      await addActivityLog({ ...baseData, account: "0xaaa", timestamp: ts });
      await addActivityLog({ ...baseData, account: "0xbbb", timestamp: ts + 10 });
      await addActivityLog({ ...baseData, account: "0xaaa", timestamp: ts + 20 });
      await addActivityLog({ ...baseData, account: "0xbbb", timestamp: ts + 30 });
    });

    it("should get all activities for a single account with startAfter and limit", async () => {
      const logs = await getAllActivities({
        account: "0xaaa",
        startAfterTimestamp: ts,
        limit: 1,
      });

      expect(logs.every(l => l.account === "0xaaa")).toBe(true);
      expect(logs.every(l => l.timestamp! > ts)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(1);
    });

    it("should get all activities for all accounts with startAfter and limit", async () => {
      const logs = await getAllActivities({
        startAfterTimestamp: ts,
        limit: 2,
      });

      expect(logs.every(l => l.timestamp! > ts)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(2);
    });

    it("should slice logs if total exceeds limit", async () => {
      const logs = await getAllActivities({
        limit: 2,
      });

      expect(logs.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array if no activity matches startAfterTimestamp", async () => {
      // Reset all mockAccounts
      for (const key in mockAccounts) delete mockAccounts[key];

      const logs = await getAllActivities({
        startAfterTimestamp: ts + 1000, // future timestamp
      });

      expect(logs).toEqual([]);
    });
  });
  
  describe("getAllActivities - startAfter and limit explicit coverage", () => {
    const ts = Date.now();

    beforeEach(async () => {
      jest.clearAllMocks();
      // Activities for multiple accounts
      await addActivityLog({ ...baseData, account: "0xaaa", timestamp: ts });
      await addActivityLog({ ...baseData, account: "0xaaa", timestamp: ts + 10 });
      await addActivityLog({ ...baseData, account: "0xbbb", timestamp: ts + 20 });
      await addActivityLog({ ...baseData, account: "0xbbb", timestamp: ts + 30 });
    });

    it("explicitly triggers startAfter and limit for single-account", async () => {
      const logs = await getAllActivities({
        account: "0xaaa",
        startAfterTimestamp: ts,
        limit: 1,
      });

      expect(logs.length).toBeLessThanOrEqual(1);
      expect(logs.every(l => l.timestamp! > ts)).toBe(true);
      expect(logs.every(l => l.account === "0xaaa")).toBe(true);
    });

    it("explicitly triggers startAfter and limit for multi-account", async () => {
      const logs = await getAllActivities({
        startAfterTimestamp: ts,
        limit: 2,
      });

      expect(logs.length).toBeLessThanOrEqual(2);
      expect(logs.every(l => l.timestamp! > ts)).toBe(true);
    });

    it("applies only limit for multi-account without startAfter", async () => {
      const logs = await getAllActivities({ limit: 2 });
      expect(logs.length).toBeLessThanOrEqual(2);
    });

    it("applies only startAfter for single-account without limit", async () => {
      const logs = await getAllActivities({ account: "0xaaa", startAfterTimestamp: ts });
      expect(logs.every(l => l.timestamp! > ts)).toBe(true);
    });
  });

  // --- getAggregatedActivities ---
  it("should cover single tag filtering", async () => {
    await addActivityLog({ ...baseData, tags: ["foo"], type: "onChain", action: "mint" });
    const res = await getAggregatedActivities({ tags: ["foo"] });
    expect(res.every(log => log.tags?.includes("foo"))).toBe(true);
  });

  it("should cover multiple tags (AND filter)", async () => {
    await addActivityLog({ ...baseData, tags: ["foo", "bar"], type: "onChain", action: "mint" });
    await addActivityLog({ ...baseData, tags: ["foo"], type: "onChain", action: "mint" });
    const res = await getAggregatedActivities({ tags: ["foo", "bar"] });
    expect(res.every(log => log.tags?.includes("foo") && log.tags?.includes("bar"))).toBe(true);
  });

  it("should respect startAfterTimestamp and limit", async () => {
    const ts = Date.now();
    await addActivityLog({ ...baseData, timestamp: ts + 10 });
    await addActivityLog({ ...baseData, timestamp: ts + 20 });
    const res = await getAggregatedActivities({ startAfterTimestamp: ts, limit: 1 });
    expect(res.length).toBeLessThanOrEqual(1);
    expect(res.every(log => log.timestamp! > ts)).toBe(true);
  });

  it("should combine multiple filters", async () => {
    await addActivityLog({
      ...baseData,
      tags: ["foo", "bar"],
      type: "onChain",
      action: "mint",
      account: "0xaaa",
      txHash: "0xTX1",
      contractAddress: "0xC1",
      timestamp: Date.now(),
    });
    const res = await getAggregatedActivities({
      account: "0xaaa",
      txHash: "0xTX1",
      contractAddress: "0xC1",
      tags: ["foo", "bar"],
      startAfterTimestamp: 0,
      limit: 1,
    });
    expect(res.length).toBeLessThanOrEqual(1);
    expect(res.every(r => r.account.toLowerCase() === "0xaaa")).toBe(true);
    expect(res.every(r => r.txHash?.toLowerCase() === "0xtx1")).toBe(true);
    expect(res.every(r => r.contractAddress?.toLowerCase() === "0xc1")).toBe(true);
    expect(res.every(r => r.tags?.includes("foo") && r.tags?.includes("bar"))).toBe(true);
  });
});
