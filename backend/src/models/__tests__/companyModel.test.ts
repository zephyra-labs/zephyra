/**
 * @file companyModel.test.ts
 * @description Unit tests for CompanyModel with full coverage
 */

import { CompanyModel } from "../companyModel";
import type { Company } from "../../types/Company";

// --- Mock Firebase Firestore ---
jest.mock("../../config/firebase", () => {
  const __collections: Record<string, Record<string, Company>> = {};

  const mockDoc = (collectionName: string, docId: string) => ({
    set: jest.fn(async (data: Partial<Company>) => {
      if (!__collections[collectionName]) __collections[collectionName] = {};
      __collections[collectionName][docId] = {
        id: docId,
        verified: false,
        createdAt: Date.now(),
        ...data,
      } as Company;
    }),
    get: jest.fn(async () => {
      const data = __collections[collectionName]?.[docId];
      return { exists: !!data, id: docId, data: () => data };
    }),
    update: jest.fn(async (data: Partial<Company>) => {
      const old = __collections[collectionName]?.[docId];
      if (!old) throw new Error("Company not found");
      __collections[collectionName][docId] = { ...old, ...data, updatedAt: Date.now() };
    }),
    delete: jest.fn(async () => {
      const old = __collections[collectionName]?.[docId];
      if (!old) throw new Error("Company not found");
      delete __collections[collectionName][docId];
    }),
  });

  const mockCollection = (name: string) => ({
    doc: (id: string) => mockDoc(name, id),
    add: jest.fn(async (data: Partial<Company>) => {
      const id = `company_${Math.random().toString(36).substring(2, 8)}`;
      if (!__collections[name]) __collections[name] = {};
      __collections[name][id] = {
        id,
        verified: false,
        createdAt: Date.now(),
        ...data,
      } as Company;
      return { id };
    }),
    get: jest.fn(async () => ({
      docs: Object.entries(__collections[name] || {}).map(([id, data]) => ({
        id,
        data: () => data,
      })),
    })),
    __reset: () => { __collections[name] = {}; },
  });

  return { db: { collection: (name: string) => mockCollection(name), __collections } };
});

// --- Tests ---
describe("CompanyModel Full Coverage", () => {
  const collectionName = "companies";

  const baseData: Partial<Company> = {
    name: "Zephyra Labs",
    address: "123 Ocean Drive",
    city: "Bangkok",
    stateOrProvince: "Bangkok",
    postalCode: "10110",
    country: "Thailand",
    email: "contact@zephyra.io",
    verified: true,
    createdAt: Date.now(),
  };

  beforeEach(() => {
    const { db } = jest.requireMock("../../config/firebase");
    db.__collections[collectionName] = {};
  });

  it("should create a new company", async () => {
    const result = await CompanyModel.create(baseData);
    const { db } = jest.requireMock("../../config/firebase");
    const keys = Object.keys(db.__collections[collectionName]);
    const stored = db.__collections[collectionName][keys[0]];

    expect(result.id).toBeDefined();
    expect(stored.name).toBe("Zephyra Labs");
    expect(stored.country).toBe("Thailand");
  });

  it("should update existing company", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    await CompanyModel.create(baseData);
    const id = Object.keys(db.__collections[collectionName])[0];

    const updated = await CompanyModel.update(id, { country: "Singapore" });
    expect(updated?.country).toBe("Singapore");
  });

  it("should return null if updating non-existing company", async () => {
    const result = await CompanyModel.update("nonexistent", { country: "Japan" });
    expect(result).toBeNull();
  });

  it("should delete existing company", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    await CompanyModel.create(baseData);
    const id = Object.keys(db.__collections[collectionName])[0];

    const deleted = await CompanyModel.delete(id);
    expect(deleted?.name).toBe("Zephyra Labs");
    expect(db.__collections[collectionName][id]).toBeUndefined();
  });

  it("should return null when deleting non-existing company", async () => {
    const result = await CompanyModel.delete("ghost-id");
    expect(result).toBeNull();
  });

  it("should get all companies", async () => {
    await CompanyModel.create({ ...baseData, name: "Company A" });
    await CompanyModel.create({ ...baseData, name: "Company B" });
    const all = await CompanyModel.getAll();

    expect(all.length).toBe(2);
    expect(all[0].name).toBeDefined();
  });

  it("should get company by ID", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    await CompanyModel.create(baseData);
    const id = Object.keys(db.__collections[collectionName])[0];
    const company = await CompanyModel.getById(id);

    expect(company?.name).toBe("Zephyra Labs");
    expect(company?.country).toBe("Thailand");
  });

  it("should return null when company not found by ID", async () => {
    const company = await CompanyModel.getById("nonexistent");
    expect(company).toBeNull();
  });
});
