/**
 * @file companyService.test.ts
 * @description Unit tests for CompanyService using Jest. Fully type-safe and covering edge cases.
 */

import { CompanyService } from "../companyService";
import { CompanyModel } from "../../models/companyModel";
import { notifyWithAdmins } from "../../utils/notificationHelper";
import type { Company } from "../../types/Company";

// --- Mock dependencies ---
jest.mock("../../models/companyModel");
jest.mock("../../utils/notificationHelper");

describe("CompanyService", () => {
  const mockExecutor = "user123";

  const baseCompany: Company = {
    id: "company1",
    name: "Test Company",
    address: "Test Address",
    city: "City",
    stateOrProvince: "Province",
    postalCode: "12345",
    country: "Country",
    email: "test@example.com",
    phone: "+1234567890",
    taxId: "1234567890",
    registrationNumber: "1234567890",
    businessType: "Business Type",
    website: "https://example.com",
    walletAddress: "0xABC123",
    verified: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────
  describe("createCompany", () => {
    it("should create a company with defaults if partial data provided", async () => {
      (CompanyModel.create as jest.Mock).mockResolvedValue(baseCompany);

      const result = await CompanyService.createCompany({ name: "My Company" }, mockExecutor);

      expect(CompanyModel.create).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalledWith(mockExecutor, expect.objectContaining({
        type: "system",
        title: "Company Created",
      }));
      expect(result).toEqual(baseCompany);
    });

    it("should default company name if missing", async () => {
      (CompanyModel.create as jest.Mock).mockImplementation(async (data) => data);

      const result = await CompanyService.createCompany({ address: "Some Address" }, mockExecutor);

      expect(result.name).toBe(`Company of ${mockExecutor}`);
    });
  });

  // ───────────────────────────────────────────────
  describe("updateCompany", () => {
    it("should update an existing company", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(baseCompany);
      (CompanyModel.update as jest.Mock).mockResolvedValue({ ...baseCompany, name: "Updated Name" });

      const result = await CompanyService.updateCompany(baseCompany.id, { name: "Updated Name" }, mockExecutor);

      expect(CompanyModel.getById).toHaveBeenCalledWith(baseCompany.id);
      expect(CompanyModel.update).toHaveBeenCalledWith(baseCompany.id, expect.objectContaining({ name: "Updated Name" }));
      expect(notifyWithAdmins).toHaveBeenCalledWith(mockExecutor, expect.objectContaining({
        type: "system",
        title: "Company Updated",
      }));
      expect(result.name).toBe("Updated Name");
    });

    it("should throw if company not found", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(null);
      await expect(CompanyService.updateCompany("notfound", {}, mockExecutor))
        .rejects.toThrow("Company not found");
    });

    it("should throw if updateCompany returns falsy", async () => {
      const existingCompany = { ...baseCompany };
      (CompanyModel.getById as jest.Mock).mockResolvedValue(existingCompany);
      (CompanyModel.update as jest.Mock).mockResolvedValue(null); // simulate failed update

      await expect(
        CompanyService.updateCompany("idEdge", { name: "New Name" }, mockExecutor)
      ).rejects.toThrow("Failed to update company");

      expect(CompanyModel.update).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────
  describe("deleteCompany", () => {
    it("should delete an existing company", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(baseCompany);
      (CompanyModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await CompanyService.deleteCompany(baseCompany.id, mockExecutor);

      expect(CompanyModel.delete).toHaveBeenCalledWith(baseCompany.id);
      expect(notifyWithAdmins).toHaveBeenCalledWith(mockExecutor, expect.objectContaining({
        type: "system",
        title: "Company Deleted",
      }));
      expect(result).toBe(true);
    });

    it("should throw if company not found", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(null);
      await expect(CompanyService.deleteCompany("notfound", mockExecutor))
        .rejects.toThrow("Company not found");
    });
  });

  // ───────────────────────────────────────────────
  describe("getAllCompanies", () => {
    it("should return all companies", async () => {
      (CompanyModel.getAll as jest.Mock).mockResolvedValue([baseCompany]);
      const result = await CompanyService.getAllCompanies();
      expect(result).toEqual([baseCompany]);
    });
  });

  // ───────────────────────────────────────────────
  describe("getCompanyById", () => {
    it("should return a company by ID", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(baseCompany);
      const result = await CompanyService.getCompanyById(baseCompany.id);
      expect(result).toEqual(baseCompany);
    });

    it("should return null if company not found", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(null);
      const result = await CompanyService.getCompanyById("notfound");
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────
  describe("createDefaultForUser", () => {
    it("should create a default company for a user", async () => {
      (CompanyModel.create as jest.Mock).mockResolvedValue(baseCompany);

      const result = await CompanyService.createDefaultForUser("0xABC123");

      expect(CompanyModel.create).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalledWith("0xABC123", expect.objectContaining({
        type: "system",
        title: "Company Created",
      }));
      expect(result).toEqual(baseCompany);
    });
  });
});
