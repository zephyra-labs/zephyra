/**
 * @file companyController.test.ts
 * @description Unit tests for companyController
 */

import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../companyController";
import { CompanyService } from "../../services/companyService";
import type { Request, Response } from "express";

// --- Helper: Mock Response Type-safe ---
function createMockResponse(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
}

// --- Mock CompanyService ---
jest.mock("../../services/companyService");

describe("companyController", () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  // --- createCompany ---
  describe("createCompany", () => {
    const reqBody = { executor: "admin", name: "TestCo" };

    it("should create a company", async () => {
      const company = { id: "1", ...reqBody };
      (CompanyService.createCompany as jest.Mock).mockResolvedValue(company);

      await createCompany({ body: reqBody } as unknown as Request, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: company })
      );
    });

    it("should fail if executor missing", async () => {
      await createCompany(
        { body: { name: "TestCo" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should fail if company name missing or not string (422)", async () => {
      await createCompany(
        { body: { executor: "admin", name: 123 } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Company name is required and must be a string",
        })
      );
    });

    it("should handle service errors", async () => {
      (CompanyService.createCompany as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await createCompany({ body: reqBody } as unknown as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // --- getCompanies ---
  describe("getCompanies", () => {
    it("should return list of companies", async () => {
      const companies = [{ id: "1", name: "TestCo" }];
      (CompanyService.getAllCompanies as jest.Mock).mockResolvedValue(
        companies
      );

      await getCompanies({} as unknown as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: companies })
      );
    });

    it("should handle errors", async () => {
      (CompanyService.getAllCompanies as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await getCompanies({} as unknown as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // --- getCompanyById ---
  describe("getCompanyById", () => {
    it("should return company details", async () => {
      const company = { id: "1", name: "TestCo" };
      (CompanyService.getCompanyById as jest.Mock).mockResolvedValue(company);

      await getCompanyById(
        { params: { id: "1" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: company })
      );
    });

    it("should return 404 if company not found", async () => {
      (CompanyService.getCompanyById as jest.Mock).mockResolvedValue(null);

      await getCompanyById(
        { params: { id: "1" } } as unknown as Request,
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle service errors", async () => {
      (CompanyService.getCompanyById as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await getCompanyById(
        { params: { id: "1" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
    
    it("should fail if company ID missing", async () => {
      await getCompanyById({ params: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Company ID is required" })
      );
    });
  });

  // --- updateCompany ---
  describe("updateCompany", () => {
    const reqBody = { executor: "admin", name: "UpdatedCo" };

    it("should update company", async () => {
      const updated = { id: "1", ...reqBody };
      (CompanyService.updateCompany as jest.Mock).mockResolvedValue(updated);

      await updateCompany(
        { params: { id: "1" }, body: reqBody } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: updated })
      );
    });

    it("should fail if executor missing", async () => {
      await updateCompany(
        {
          params: { id: "1" },
          body: { name: "UpdatedCo" },
        } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should fail if company name is not string (422)", async () => {
      await updateCompany(
        {
          params: { id: "1" },
          body: { executor: "admin", name: 123 },
        } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Company name must be a string",
        })
      );
    });

    it("should handle service errors", async () => {
      (CompanyService.updateCompany as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await updateCompany(
        { params: { id: "1" }, body: reqBody } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
    
    it("should fail if company ID missing", async () => {
      await updateCompany({ params: {}, body: { executor: "admin", name: "X" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Company ID is required" })
      );
    });
    
    it("should fail if update target not found", async () => {
      (CompanyService.updateCompany as jest.Mock).mockResolvedValue(null);
      await updateCompany({ params: { id: "1" }, body: { executor: "admin", name: "X" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Company not found" })
      );
    });
    
    it("should fail if executor missing on update", async () => {
      await updateCompany({ params: { id: "1" }, body: { name: "X" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Executor is required" })
      );
    });
  });

  // --- deleteCompany ---
  describe("deleteCompany", () => {
    it("should delete company with executor in body", async () => {
      (CompanyService.deleteCompany as jest.Mock).mockResolvedValue(true);

      await deleteCompany(
        { params: { id: "1" }, body: { executor: "admin" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { message: "Company deleted successfully" },
        })
      );
    });

    it("should delete company with executor in header", async () => {
      (CompanyService.deleteCompany as jest.Mock).mockResolvedValue(true);

      await deleteCompany(
        {
          params: { id: "1" },
          body: {},
          headers: { "x-executor": "admin" },
        } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { message: "Company deleted successfully" },
        })
      );
    });

    it("should fail if executor missing", async () => {
      await deleteCompany(
        { params: { id: "1" }, body: {} } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should handle service errors", async () => {
      (CompanyService.deleteCompany as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await deleteCompany(
        { params: { id: "1" }, body: { executor: "admin" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
    
    it("should fail if company ID missing on delete", async () => {
      await deleteCompany({ params: {}, body: { executor: "admin" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Company ID is required" })
      );
    });

    it("should fail if executor missing on delete", async () => {
      await deleteCompany(
        { params: { id: "1" }, body: {}, headers: {} } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Executor is required",
        })
      );
    });

    it("should fail if delete target not found", async () => {
      (CompanyService.deleteCompany as jest.Mock).mockResolvedValue(false);
      await deleteCompany({ params: { id: "1" }, body: { executor: "admin" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Company not found" })
      );
    });
  });
});
