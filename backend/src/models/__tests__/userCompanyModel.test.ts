/**
 * @file userCompanyModel.test.ts
 * @description Unit tests for UserCompanyModel with a robust in-memory Firestore mock.
 * @notes Covers create, read, update, delete, and filtered queries, with full TypeScript type safety.
 */

import { UserCompanyModel } from "@/models/userCompanyModel";
import type { CreateUserCompanyDTO } from "@/types/UserCompany";

// --- Mock Firestore dependency
jest.mock("@/config/firebase", () => {
  const dataStore: Record<string, any> = {};
  let idCounter = 1;

  // Shared collection instance to simulate Firestore collection
  const mockCollectionInstance = {
    filters: [] as ((item: any) => boolean)[],
    searchTerm: null as string | null,
    orderField: null as string | null,
    orderDirection: "asc" as "asc" | "desc",
    limitCount: null as number | null,
    offsetCount: null as number | null,

    add: jest.fn(async (data) => {
      const id = "id" + idCounter++;
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
      update: jest.fn(async (data) => {
        if (!dataStore[id]) throw new Error("not found");
        dataStore[id] = { ...dataStore[id], ...data };
        return true;
      }),
      delete: jest.fn(async () => {
        if (!dataStore[id]) throw new Error("not found");
        delete dataStore[id];
        return true;
      }),
    })),

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

    offset: jest.fn(function (count: number) {
      this.offsetCount = count;
      return this;
    }),

    search: jest.fn(function (term: string) {
      this.searchTerm = term.toLowerCase();
      return this;
    }),

    get: jest.fn(async function () {
      let items = Object.values(dataStore);

      // Apply filters
      for (const filter of this.filters) items = items.filter(filter);

      // Apply search term
      if (this.searchTerm) {
        items = items.filter(item => item.userAddress?.toLowerCase().includes(this.searchTerm!));
      }

      // Apply ordering
      if (this.orderField) {
        items.sort((a, b) => {
          const aVal = a[this.orderField!];
          const bVal = b[this.orderField!];
          if (aVal < bVal) return this.orderDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return this.orderDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Apply offset & limit
      if (this.offsetCount) items = items.slice(this.offsetCount);
      if (this.limitCount != null) items = items.slice(0, this.limitCount);

      return {
        size: items.length,
        empty: items.length === 0,
        docs: items.map(d => ({ id: d.id, data: () => d })),
      };
    }),

    // Reset mock state between tests
    __reset: function () {
      this.filters = [];
      this.searchTerm = null;
      this.orderField = null;
      this.orderDirection = "asc";
      this.limitCount = null;
      this.offsetCount = null;
    },
  };

  const mockCollection = jest.fn(() => mockCollectionInstance);
  return { db: { collection: mockCollection }, __dataStore: dataStore };
});

describe("UserCompanyModel", () => {
  const now = Date.now();

  // Utility to create DTOs with default values
  const makeDTO = (overrides: Partial<CreateUserCompanyDTO> = {}): CreateUserCompanyDTO => ({
    userAddress: "0xAAA",
    companyId: "comp001",
    joinedAt: now,
    ...overrides,
  });

  beforeEach(() => {
    // Reset in-memory store and collection state
    const mockFirebase = jest.requireMock("@/config/firebase");
    for (const key of Object.keys(mockFirebase.__dataStore)) delete mockFirebase.__dataStore[key];
    mockFirebase.db.collection().__reset();
  });

  it("should create a new user-company relation", async () => {
    const result = await UserCompanyModel.create(makeDTO());
    expect(result).toMatchObject({ userAddress: "0xAAA", companyId: "comp001", role: "staff", status: "pending" });
    expect(result).toHaveProperty("id");
  });

  it("should retrieve all user-company relations with filtering", async () => {
    await UserCompanyModel.create(makeDTO({ userAddress: "0xAAA", role: "staff", status: "active" }));
    await UserCompanyModel.create(makeDTO({ userAddress: "0xBBB", companyId: "comp002", role: "manager" }));

    const result = await UserCompanyModel.getAllFiltered({ page: 1, limit: 10, role: "staff" });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should get relation by ID", async () => {
    const created = await UserCompanyModel.create(makeDTO({ userAddress: "0x123", companyId: "compX" }));
    const found = await UserCompanyModel.getById(created.id);
    expect(found).not.toBeNull();
    expect(found?.userAddress).toBe("0x123");
  });

  it("should return null when getting non-existing relation", async () => {
    const result = await UserCompanyModel.getById("nonexistent");
    expect(result).toBeNull();
  });

  it("should get all relations for a user", async () => {
    await UserCompanyModel.create(makeDTO({ userAddress: "0xUSER", companyId: "compA" }));
    await UserCompanyModel.create(makeDTO({ userAddress: "0xUSER", companyId: "compB" }));

    const results = await UserCompanyModel.getByUser("0xUSER");
    expect(results.length).toBe(2);
  });

  it("should get all relations for a company", async () => {
    await UserCompanyModel.create(makeDTO({ userAddress: "0x001", companyId: "comp999" }));
    const results = await UserCompanyModel.getByCompany("comp999");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].companyId).toBe("comp999");
  });

  it("should update an existing relation", async () => {
    const created = await UserCompanyModel.create(makeDTO({ userAddress: "0x999", companyId: "comp777" }));
    const updated = await UserCompanyModel.update(created.id, { role: "manager", status: "active" });
    expect(updated?.role).toBe("manager");
    expect(updated?.status).toBe("active");
  });

  it("should return null if updating non-existing relation", async () => {
    const updated = await UserCompanyModel.update("fakeId", { role: "admin" });
    expect(updated).toBeNull();
  });

  it("should delete an existing relation", async () => {
    const created = await UserCompanyModel.create(makeDTO({ userAddress: "0xDEL", companyId: "compDEL" }));
    const deleted = await UserCompanyModel.delete(created.id);
    expect(deleted).toBe(true);
    const check = await UserCompanyModel.getById(created.id);
    expect(check).toBeNull();
  });

  it("should return false when deleting non-existing relation", async () => {
    const deleted = await UserCompanyModel.delete("nope");
    expect(deleted).toBe(false);
  });

  it("should filter by search keyword in userAddress", async () => {
    await UserCompanyModel.create(makeDTO({ userAddress: "0xABC123", companyId: "compX" }));
    await UserCompanyModel.create(makeDTO({ userAddress: "0xZZZ999", companyId: "compY" }));

    const result = await UserCompanyModel.getAllFiltered({ page: 1, limit: 10, search: "0xABC" });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every(r => r.userAddress.startsWith("0xABC"))).toBe(true);
  });

  it("should filter by multiple parameters (companyId + role + search)", async () => {
    await UserCompanyModel.create(makeDTO({ userAddress: "0xABC111", companyId: "compX", role: "staff" }));
    await UserCompanyModel.create(makeDTO({ userAddress: "0xABC222", companyId: "compX", role: "manager" }));
    await UserCompanyModel.create(makeDTO({ userAddress: "0xABC333", companyId: "compY", role: "staff" }));

    const result = await UserCompanyModel.getAllFiltered({
      page: 1,
      limit: 10,
      search: "0xABC",
      companyId: "compX",
      role: "staff",
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].userAddress).toBe("0xABC111");
  });
});
