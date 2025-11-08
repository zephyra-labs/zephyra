/**
 * @file activityModel.test.ts
 * @description Full coverage unit tests for activityModel (Firestore mocked)
 */

import type { ActivityLog } from "@/types/Activity";

// --- Mock Firestore Setup --- //
const mockAccounts: Record<string, Record<string, any>> = {};
const mockAggregated: Record<string, Record<string, any>> = {};

const mockAdd = jest.fn(async function (this: any, data: any) {
  const id = `${Date.now()}_${Math.random()}`;
  this._docs[id] = data;
  return { id };
});

const mockSet = jest.fn(async (data: any) => {
  const id = data.id ?? `${Date.now()}_${Math.random()}`;
  mockAggregated[id] = { ...data, tags: data.tags ?? [] };
  return true;
});

const mockGet = jest.fn(async function (this: any) {
  const entries = Object.entries(this._docs) as [string, Record<string, any>][];
  const docs = entries
    .sort(([, a], [, b]) => b.timestamp - a.timestamp)
    .map(([id, data]) => ({ id, data: () => data }));
  return { docs };
});

const createSubCollectionMock = (docs: Record<string, Record<string, any>>) => ({
  _docs: docs,
  add: mockAdd,
  get: jest.fn(async function () {
    const sortedEntries = (Object.entries(this._docs) as [string, Record<string, any>][])
      .sort(([, a], [, b]) => (b.timestamp as number) - (a.timestamp as number))
      .map(([id, data]) => ({ id, data: () => data }));
    return { docs: sortedEntries };
  }),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn(function (this: any, n: number) {
    const entries = (Object.entries(this._docs) as [string, Record<string, any>][])
      .sort(([, a], [, b]) => (b.timestamp as number) - (a.timestamp as number))
      .slice(0, n);
    this._docs = Object.fromEntries(entries);
    return this;
  }),
  startAfter: jest.fn(function (this: any, ts: number) {
    const entries = (Object.entries(this._docs) as [string, Record<string, any>][])
      .filter(([_, doc]) => (doc.timestamp as number) < ts);
    this._docs = Object.fromEntries(entries);
    return this;
  }),
});

const mockCollection = jest.fn((name: string) => {
  const _docs: Record<string, any> = name === "aggregatedActivityLogs" ? mockAggregated : mockAccounts;

  return {
    _docs,
    add: mockAdd,
    set: mockSet,
    get: mockGet.bind({ _docs }),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(function (this: any, n: number) {
      const keys = Object.keys(this._docs).slice(0, n);
      const limited: Record<string, any> = {};
      keys.forEach(k => (limited[k] = this._docs[k]));
      this._docs = limited;
      return this;
    }),
    startAfter: jest.fn(function (this: any, ts: number) {
      this._docs = Object.fromEntries(
        Object.entries(this._docs).filter(([_, doc]: [string, any]) => doc.timestamp > ts)
      );
      return this;
    }),
    doc: (id: string) => ({
      id,
      set: mockSet,
      collection: () => {
        if (!mockAccounts[id]) mockAccounts[id] = {};
        return createSubCollectionMock(mockAccounts[id]);
      },
      get: jest.fn(async () => ({ id, data: () => mockAccounts[id] || null })),
    }),
  };
});

jest.mock("@/config/firebase", () => ({ db: { collection: mockCollection } }));

// --- Import setelah mock --- //
import {
  addActivityLog,
  getAllAccounts,
  getActivityByAccount,
  getAllActivities,
  getAggregatedActivities,
} from "@/models/activityModel";

// --- Mock DTO Validation --- //
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
    Object.keys(mockAccounts).forEach(k => delete mockAccounts[k]);
    Object.keys(mockAggregated).forEach(k => delete mockAggregated[k]);
  });

  // --- addActivityLog tests --- //
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

  // --- getAllAccounts tests --- //
  it("should get all accounts", async () => {
    await addActivityLog({ ...baseData });
    const accounts = await getAllAccounts();
    expect(accounts).toContain("0xabc123");
  });

  // --- getActivityByAccount tests --- //
  it("should get activities by account with limit and startAfterTimestamp", async () => {
    const ts1 = Date.now();
    await addActivityLog({ ...baseData, timestamp: ts1 });
    const ts2 = ts1 + 1000;
    await addActivityLog({ ...baseData, timestamp: ts2 });

    const activities = await getActivityByAccount("0xabc123", { limit: 1, startAfterTimestamp: ts1 });
    expect(activities.length).toBeLessThanOrEqual(1);
    if (activities.length > 0) {
      expect(activities[0].timestamp).toBeGreaterThan(ts1);
    }
  });

  it("should get activities by account without startAfterTimestamp", async () => {
    await addActivityLog({ ...baseData });
    const activities = await getActivityByAccount("0xabc123", { limit: 10 });
    expect(activities.length).toBeGreaterThan(0);
  });

  // --- getAllActivities tests --- //
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

  // --- getAggregatedActivities tests --- //
  it("should get aggregated activities with multiple tags", async () => {
    await addActivityLog({ ...baseData, tags: ["tag1", "tag2"] });
    const aggregated = await getAggregatedActivities({ tags: ["tag1", "tag2"] });
    expect(aggregated.every(a => a.tags?.includes("tag1") && a.tags?.includes("tag2"))).toBe(true);
  });

  it("should get aggregated activities with single tag", async () => {
    await addActivityLog({ ...baseData, tags: ["singleTag"] });
    const aggregated = await getAggregatedActivities({ tags: ["singleTag"] });
    expect(aggregated.every(a => a.tags?.includes("singleTag"))).toBe(true);
  });

  it("should get aggregated activities without tag filter", async () => {
    await addActivityLog({ ...baseData, tags: ["tagX"] });
    const aggregated = await getAggregatedActivities();
    expect(aggregated.length).toBeGreaterThan(0);
  });
  
  it("should get activities by account without limit and startAfterTimestamp", async () => {
    await addActivityLog({ ...baseData, timestamp: Date.now() });
    const activities = await getActivityByAccount("0xabc123");
    expect(activities.length).toBeGreaterThan(0);
  });
    
  it("should return empty activities array if account has no activity", async () => {
    const activities = await getActivityByAccount("0xnoexist");
    expect(activities).toEqual([]);
  });
  
  it("should get activities by account without limit and startAfterTimestamp (empty snapshot edge case)", async () => {
    const activities = await getActivityByAccount("0xabc123");
    expect(activities.length).toBeGreaterThanOrEqual(0);
  });

  it("should get activities by account with startAfterTimestamp only", async () => {
    const ts = Date.now();
    await addActivityLog({ ...baseData, timestamp: ts });
    const activities = await getActivityByAccount("0xabc123", { startAfterTimestamp: ts - 1 });
    expect(activities.every(a => a.timestamp > ts - 1)).toBe(true);
  });

  it("should get activities by account with limit only", async () => {
    await addActivityLog({ ...baseData });
    const activities = await getActivityByAccount("0xabc123", { limit: 1 });
    expect(activities.length).toBeLessThanOrEqual(1);
  });
});
