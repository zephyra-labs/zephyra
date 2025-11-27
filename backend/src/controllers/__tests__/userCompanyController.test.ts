/**
 * @file userCompanyController.test.ts
 * @description Unit tests for UserCompanyController
 */

import { Request, Response } from "express";
import { UserCompanyController } from "../userCompanyController";
import { UserCompanyService } from "../../services/userCompanyService";
import { CompanyService } from "../../services/companyService";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/userCompanyService");
jest.mock("../../services/companyService");
jest.mock("../../utils/responseHelper");

function mockRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
}

describe("UserCompanyController FULL", () => {
  let res: jest.Mocked<Response>;

  const mockRelation = { id: "rel1", userAddress: "0xUSER1", companyId: "comp1", role: "owner" };
  const mockCompany = { id: "comp1", name: "Test Company" };

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
  });

  // -------------------------------------------------
  // CREATE
  // -------------------------------------------------
  describe("create()", () => {
    it("OK", async () => {
      (UserCompanyService.createUserCompany as jest.Mock).mockResolvedValue(mockRelation);

      await UserCompanyController.create({ body: mockRelation } as any, res);

      expect(success).toHaveBeenCalledWith(res, mockRelation, 201);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.createUserCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.create({ body: {} } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to create user-company relation", 500);
    });
  });

  // -------------------------------------------------
  // GET ALL
  // -------------------------------------------------
  describe("getAll()", () => {
    it("OK default params", async () => {
      (UserCompanyService.getAllFiltered as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getAll({ query: {} } as any, res);

      expect(UserCompanyService.getAllFiltered).toHaveBeenCalledWith({
        page: 1, limit: 10,
        search: undefined, role: undefined,
        status: undefined, companyId: undefined,
      });
      expect(success).toHaveBeenCalled();
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.getAllFiltered as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.getAll({ query: {} } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch user-company relations");
    });
  });

  // -------------------------------------------------
  // GET BY ID
  // -------------------------------------------------
  describe("getById()", () => {
    it("Missing ID → 422", async () => {
      await UserCompanyController.getById({ params: {} } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing id parameter", 422);
    });

    it("Not found → 404", async () => {
      (UserCompanyService.getById as jest.Mock).mockResolvedValue(null);

      await UserCompanyController.getById({ params: { id: "x" } } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "Relation not found", 404);
    });

    it("OK", async () => {
      (UserCompanyService.getById as jest.Mock).mockResolvedValue(mockRelation);

      await UserCompanyController.getById({ params: { id: "rel1" } } as any, res);

      expect(success).toHaveBeenCalledWith(res, mockRelation, 200);
    });

    it("ERROR", async () => {
      const err = new Error("fail");
      (UserCompanyService.getById as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.getById({ params: { id: "rel1" } } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch relation", 500);
    });
  });

  // -------------------------------------------------
  // GET BY USER
  // -------------------------------------------------
  describe("getByUser()", () => {
    it("Missing address → 422", async () => {
      await UserCompanyController.getByUser({ params: {} } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing user address", 422);
    });

    it("None found → 404", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([]);

      await UserCompanyController.getByUser({ params: { address: "0xA" } } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "No relations found for user", 404);
    });

    it("OK", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getByUser({ params: { address: "0xUSER1" } } as any, res);

      expect(success).toHaveBeenCalledWith(res, [mockRelation], 200);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.getByUser as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.getByUser({ params: { address: "0xUSER1" } } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch user relations", 500);
    });
  });

  // -------------------------------------------------
  // GET BY COMPANY
  // -------------------------------------------------
  describe("getByCompany()", () => {
    it("Missing → 422", async () => {
      await UserCompanyController.getByCompany({ params: {} } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing companyId parameter", 422);
    });

    it("Empty → 404", async () => {
      (UserCompanyService.getByCompany as jest.Mock).mockResolvedValue([]);

      await UserCompanyController.getByCompany({ params: { companyId: "x" } } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "No relations found for company", 404);
    });

    it("OK", async () => {
      (UserCompanyService.getByCompany as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getByCompany({ params: { companyId: "comp1" } } as any, res);

      expect(success).toHaveBeenCalledWith(res, [mockRelation], 200);
    });

    it("ERROR", async () => {
      const err = new Error("123");
      (UserCompanyService.getByCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.getByCompany({ params: { companyId: "comp1" } } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch company relations", 500);
    });
  });

  // -------------------------------------------------
  // UPDATE
  // -------------------------------------------------
  describe("update()", () => {
    it("Missing id → 422", async () => {
      await UserCompanyController.update({ params: {} } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing id parameter", 422);
    });

    it("OK", async () => {
      const updated = { ...mockRelation, role: "viewer" };
      (UserCompanyService.updateUserCompany as jest.Mock).mockResolvedValue(updated);

      await UserCompanyController.update(
        { params: { id: "rel1" }, body: { role: "viewer" } } as any,
        res
      );

      expect(success).toHaveBeenCalledWith(res, updated, 200);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.updateUserCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.update(
        { params: { id: "rel1" }, body: {} } as any,
        res
      );

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update relation", 500);
    });
  });

  // -------------------------------------------------
  // DELETE
  // -------------------------------------------------
  describe("delete()", () => {
    it("Missing id → 422", async () => {
      await UserCompanyController.delete({ params: {} } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing id parameter", 422);
    });

    it("OK", async () => {
      (UserCompanyService.deleteUserCompany as jest.Mock).mockResolvedValue(undefined);

      await UserCompanyController.delete({ params: { id: "rel1" } } as any, res);

      expect(success).toHaveBeenCalledWith(res, { message: "Relation deleted successfully" }, 200);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.deleteUserCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.delete({ params: { id: "rel1" } } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to delete relation", 500);
    });
  });

  // -------------------------------------------------
  // GET MY COMPANY
  // -------------------------------------------------
  describe("getMyCompany()", () => {
    it("Missing auth → 401", async () => {
      await UserCompanyController.getMyCompany({ user: null } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing or invalid Authorization header", 401);
    });

    it("No relation → 404", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([]);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "No company relation found", 404);
    });

    it("Company not found → 404", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.getCompanyById as jest.Mock).mockResolvedValue(null);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "Company not found", 404);
    });

    it("OK", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.getCompanyById as jest.Mock).mockResolvedValue(mockCompany);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, res);

      expect(success).toHaveBeenCalledWith(res, mockCompany, 200);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.getByUser as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch user's company", 500);
    });
  });

  // -------------------------------------------------
  // UPDATE MY COMPANY
  // -------------------------------------------------
  describe("updateMyCompany()", () => {
    it("Missing auth → 401", async () => {
      await UserCompanyController.updateMyCompany({ user: null } as any, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing or invalid Authorization header", 401);
    });

    it("No relation → 404", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([]);

      await UserCompanyController.updateMyCompany({ user: { address: "0xA" }, body: {} } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "User is not linked to any company", 404);
    });

    it("Not owner → 403", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([{ ...mockRelation, role: "member" }]);

      await UserCompanyController.updateMyCompany({ user: { address: "0xUSER1" }, body: {} } as any, res);

      expect(failure).toHaveBeenCalledWith(res, "Only company owner can update company data", 403);
    });

    it("OK", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.updateCompany as jest.Mock).mockResolvedValue(mockCompany);

      await UserCompanyController.updateMyCompany(
        { user: { address: "0xUSER1" }, body: { name: "New" } } as any,
        res
      );

      expect(success).toHaveBeenCalledWith(res, mockCompany, 200);
    });

    it("ERROR", async () => {
      const err = new Error("x");
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.updateCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.updateMyCompany(
        { user: { address: "0xUSER1" }, body: {} } as any,
        res
      );

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update company", 500);
    });
  });
});
