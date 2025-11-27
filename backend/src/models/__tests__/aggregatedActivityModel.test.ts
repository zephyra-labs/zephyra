/**
 * @file aggregatedActivityModel.test.ts
 * @description Full coverage tests for aggregatedActivityModel (patched types).
 */

import aggregatedActivityModel from "../aggregatedActivityModel"
import type { AggregatedActivityLog } from "../../types/AggregatedActivity"

// --- Mock Firebase Admin FieldValue ---
jest.mock("firebase-admin", () => ({
  firestore: {
    FieldValue: {
      arrayUnion: (item: unknown) => ({ __op: "arrayUnion", value: item }),
      arrayRemove: (item: unknown) => ({ __op: "arrayRemove", value: item }),
      serverTimestamp: () => Date.now(),
    },
  },
}))

jest.mock("../../config/firebase", () => {
  type FirestoreData = Record<string, Record<string, any>>
  const __collections: FirestoreData = {}

  const applyFieldOps = (oldArr: any[] = [], ops: any) => {
    if (!ops) return oldArr
    if (ops.__op === "arrayUnion") return [...new Set([...(oldArr || []), ops.value])]
    if (ops.__op === "arrayRemove") return (oldArr || []).filter((x) => x !== ops.value)
    return oldArr
  }

  const filterDocs = (docs: any[], filters: any[]) => {
    return docs.filter((doc) =>
      filters.every(({ field, op, val }) => {
        const dataVal = doc[field]
        if (op === "==") return dataVal === val
        if (op === "array-contains")
          return Array.isArray(dataVal) && dataVal.includes(val)
        if (Array.isArray(val))
          return Array.isArray(dataVal) && val.every((v: any) => dataVal.includes(v))
        return true
      })
    )
  }

  interface QueryMock {
    get: () => Promise<{ docs: { id: string; data: () => any }[] }>
    where: (field: string, op: string, val: any) => QueryMock
    orderBy: (field: string, dir?: string) => QueryMock
    startAfter: (timestamp: number) => QueryMock
    limit: (n: number) => QueryMock
  }

  const mockQuery = (col: string, baseData: any[], appliedFilters: any[] = []): QueryMock => ({
    where: (field: string, op: string, val: any) =>
      mockQuery(col, baseData, [...appliedFilters, { field, op, val }]),
    orderBy: () => mockQuery(col, baseData, appliedFilters),
    startAfter: () => mockQuery(col, baseData, appliedFilters),
    limit: () => mockQuery(col, baseData, appliedFilters),
    get: jest.fn(async () => {
      const filtered = filterDocs(baseData, appliedFilters)
      return {
        docs: filtered.map((d) => ({ id: d.id || "", data: () => d })),
      }
    }),
  })

  const mockDoc = (col: string, id: string) => ({
    set: jest.fn(async (data: any) => {
      __collections[col] = __collections[col] || {}
      __collections[col][id] = { ...(data || {}) }
    }),
    get: jest.fn(async () => ({
      exists: !!__collections[col]?.[id],
      data: () => __collections[col]?.[id],
    })),
    update: jest.fn(async (data: any) => {
      if (!__collections[col]?.[id]) throw new Error("Document does not exist")
      const old = __collections[col][id]
      const updated: Record<string, any> = { ...old }
      for (const key in data) {
        const val = data[key]
        if (val?.__op) updated[key] = applyFieldOps(old[key], val)
        else updated[key] = val
      }
      __collections[col][id] = updated
    }),
  })

  const mockCollection = (col: string): any => ({
    doc: (id: string) => mockDoc(col, id),
    where: (field: string, op: string, val: any) => mockQuery(col, Object.values(__collections[col] || {}), [{ field, op, val }]),
    orderBy: jest.fn(() => mockCollection(col)),
    startAfter: jest.fn(() => mockCollection(col)),
    limit: jest.fn(() => mockCollection(col)),
    get: jest.fn(async () => ({
      docs: Object.entries(__collections[col] || {}).map(([id, data]) => ({
        id,
        data: () => data,
      })),
    })),
  })

  return { db: { collection: (name: string) => mockCollection(name), __collections } }
})

// --- actual tests ---
describe("aggregatedActivityModel", () => {
  const { db } = jest.requireMock("../../config/firebase")
  const col = "aggregatedActivityLogs"

  const baseData: AggregatedActivityLog = {
    id: "0xUserA",
    timestamp: Date.now(),
    type: "onChain" as const,
    action: "deploy",
    account: "0xUserA",
    txHash: "0xTxHash",
    contractAddress: "0xContract",
    tags: [],
  }

  beforeEach(() => {
    db.__collections[col] = {}
  })

  it("should add a new aggregated activity log", async () => {
    const entry = await aggregatedActivityModel.add(baseData)
    expect(entry).toBeDefined()
    expect(entry.id).toContain("0xUserA")
  })

  it("should get log by id", async () => {
    const entry = await aggregatedActivityModel.add(baseData)
    const fetched = await aggregatedActivityModel.getById(entry.id)
    expect(fetched?.id).toBe(entry.id)
  })

  it("should return null if getById not found", async () => {
    const res = await aggregatedActivityModel.getById("missing-id")
    expect(res).toBeNull()
  })

  it("should get all logs with pagination and limit", async () => {
    await aggregatedActivityModel.add({ ...baseData, account: "0xU1" })
    await aggregatedActivityModel.add({ ...baseData, account: "0xU2" })
    const res = await aggregatedActivityModel.getAll({ limit: 1, startAfterTimestamp: 0 })
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.nextStartAfterTimestamp).not.toBeNull()
  })

  it("should filter by account, txHash, and contractAddress", async () => {
    const entry = await aggregatedActivityModel.add({
      ...baseData,
      account: "0xFilter",
      txHash: "0xHash",
      contractAddress: "0xCA",
    })
    const res = await aggregatedActivityModel.getAll({
      account: "0xFilter",
      txHash: "0xHash",
      contractAddress: "0xCA",
    })
    expect(res.data[0].id).toBe(entry.id)
  })

  it("should handle single tag filter correctly", async () => {
    const entry = await aggregatedActivityModel.add({ ...baseData, account: "0xT1" })
    await aggregatedActivityModel.addTag(entry.id, "tag1")
    const res = await aggregatedActivityModel.getAll({ tags: ["tag1"] })
    expect(res.data.length).toBeGreaterThan(0)
  })

  it("should handle multiple tags (AND logic)", async () => {
    const entry = await aggregatedActivityModel.add({ ...baseData, account: "0xMulti" })
    await aggregatedActivityModel.addTag(entry.id, "alpha")
    await aggregatedActivityModel.addTag(entry.id, "beta")

    const res = await aggregatedActivityModel.getAll({ tags: ["alpha", "beta"] })
    expect(res.data.length).toBe(1)
    expect(res.data[0].tags).toEqual(expect.arrayContaining(["alpha", "beta"]))
  })

  it("should add and remove tag correctly", async () => {
    const entry = await aggregatedActivityModel.add(baseData)
    await aggregatedActivityModel.addTag(entry.id, "temp")
    expect(db.__collections[col][entry.id].tags).toContain("temp")

    await aggregatedActivityModel.removeTag(entry.id, "temp")
    expect(db.__collections[col][entry.id].tags).not.toContain("temp")
  })

  it("should throw when updating tag on non-existing log", async () => {
    await expect(aggregatedActivityModel.addTag("invalid", "t")).rejects.toThrow()
  })
})
