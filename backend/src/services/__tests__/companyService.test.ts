/**
 * @file companyService.test.ts
 * @description Unit tests for CompanyService using Jest.
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
  const mockCompany: Company = {
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
      (CompanyModel.create as jest.Mock).mockResolvedValue(mockCompany);

      const result = await CompanyService.createCompany({ name: "My Company" }, mockExecutor);

      expect(CompanyModel.create).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalledWith(mockExecutor, expect.objectContaining({
        type: "system",
        title: "Company Created",
      }));
      expect(result).toEqual(mockCompany);
    });
  });

  // ───────────────────────────────────────────────
  describe("updateCompany", () => {
    it("should update an existing company", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(mockCompany);
      (CompanyModel.update as jest.Mock).mockResolvedValue({ ...mockCompany, name: "Updated Name" });

      const result = await CompanyService.updateCompany(mockCompany.id, { name: "Updated Name" }, mockExecutor);

      expect(CompanyModel.getById).toHaveBeenCalledWith(mockCompany.id);
      expect(CompanyModel.update).toHaveBeenCalledWith(mockCompany.id, expect.objectContaining({ name: "Updated Name" }));
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
  });

  // ───────────────────────────────────────────────
  describe("deleteCompany", () => {
    it("should delete an existing company", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(mockCompany);
      (CompanyModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await CompanyService.deleteCompany(mockCompany.id, mockExecutor);

      expect(CompanyModel.delete).toHaveBeenCalledWith(mockCompany.id);
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
      (CompanyModel.getAll as jest.Mock).mockResolvedValue([mockCompany]);
      const result = await CompanyService.getAllCompanies();
      expect(result).toEqual([mockCompany]);
    });
  });

  // ───────────────────────────────────────────────
  describe("getCompanyById", () => {
    it("should return a company by ID", async () => {
      (CompanyModel.getById as jest.Mock).mockResolvedValue(mockCompany);
      const result = await CompanyService.getCompanyById(mockCompany.id);
      expect(result).toEqual(mockCompany);
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
      (CompanyModel.create as jest.Mock).mockResolvedValue(mockCompany);

      const result = await CompanyService.createDefaultForUser("0xABC123");

      expect(CompanyModel.create).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalledWith("0xABC123", expect.objectContaining({
        type: "system",
        title: "Company Created",
      }));
      expect(result).toEqual(mockCompany);
    });
  });
});
