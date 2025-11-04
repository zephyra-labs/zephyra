/**
 * @file userCompanyController.test.ts
 * @description Unit tests for UserCompanyController endpoints (TypeScript safe)
 */

import { Request, Response } from "express";
import { UserCompanyController } from "../userCompanyController";
import { UserCompanyService } from "../../services/userCompanyService";
import { CompanyService } from "../../services/companyService";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/userCompanyService");
jest.mock("../../services/companyService");
jest.mock("../../utils/responseHelper");

/**
 * Helper to create a fully type-safe mocked Express response
 */
function createMockResponse(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    // Response memiliki banyak method, tapi kita hanya mock yg dipakai controller
  } as unknown as jest.Mocked<Response>;
}

describe("UserCompanyController", () => {
  let mockRes: jest.Mocked<Response>;

  const mockRelation = { id: "rel1", userAddress: "0xUSER1", companyId: "comp1", role: "owner" };
  const mockCompany = { id: "comp1", name: "Test Company" };

  beforeEach(() => {
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new user-company relation", async () => {
      (UserCompanyService.createUserCompany as jest.Mock).mockResolvedValue(mockRelation);

      await UserCompanyController.create({ body: mockRelation } as unknown as Request, mockRes);

      expect(UserCompanyService.createUserCompany).toHaveBeenCalledWith(mockRelation);
      expect(success).toHaveBeenCalledWith(mockRes, mockRelation, 201);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (UserCompanyService.createUserCompany as jest.Mock).mockRejectedValue(err);

      await UserCompanyController.create({ body: {} } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to create user-company relation", 400);
    });
  });

  describe("getAll", () => {
    it("should return paginated user-company relations", async () => {
      (UserCompanyService.getAllFiltered as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getAll({ query: {} } as unknown as Request, mockRes);

      expect(UserCompanyService.getAllFiltered).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        role: undefined,
        status: undefined,
        companyId: undefined,
      });
      expect(success).toHaveBeenCalledWith(mockRes, [mockRelation]);
    });
  });

  describe("getById", () => {
    it("should return relation by ID", async () => {
      (UserCompanyService.getById as jest.Mock).mockResolvedValue(mockRelation);

      await UserCompanyController.getById({ params: { id: "rel1" } } as unknown as Request, mockRes);

      expect(success).toHaveBeenCalledWith(mockRes, mockRelation);
    });

    it("should return failure if not found", async () => {
      (UserCompanyService.getById as jest.Mock).mockResolvedValue(null);

      await UserCompanyController.getById({ params: { id: "rel999" } } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Relation not found", 404);
    });
  });

  describe("getByUser", () => {
    it("should return relations for a user", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getByUser({ params: { address: "0xUSER1" } } as unknown as Request, mockRes);

      expect(success).toHaveBeenCalledWith(mockRes, [mockRelation]);
    });
  });

  describe("getByCompany", () => {
    it("should return relations for a company", async () => {
      (UserCompanyService.getByCompany as jest.Mock).mockResolvedValue([mockRelation]);

      await UserCompanyController.getByCompany({ params: { companyId: "comp1" } } as unknown as Request, mockRes);

      expect(success).toHaveBeenCalledWith(mockRes, [mockRelation]);
    });
  });

  describe("update", () => {
    it("should update a relation", async () => {
      const updatedRelation = { ...mockRelation, role: "member" };
      (UserCompanyService.updateUserCompany as jest.Mock).mockResolvedValue(updatedRelation);

      await UserCompanyController.update(
        { params: { id: "rel1" }, body: { role: "member" } } as unknown as Request,
        mockRes
      );

      expect(UserCompanyService.updateUserCompany).toHaveBeenCalledWith("rel1", { role: "member" });
      expect(success).toHaveBeenCalledWith(mockRes, updatedRelation);
    });
  });

  describe("delete", () => {
    it("should delete a relation", async () => {
      (UserCompanyService.deleteUserCompany as jest.Mock).mockResolvedValue(undefined);

      await UserCompanyController.delete({ params: { id: "rel1" } } as unknown as Request, mockRes);

      expect(UserCompanyService.deleteUserCompany).toHaveBeenCalledWith("rel1");
      expect(success).toHaveBeenCalledWith(mockRes, { message: "Relation deleted successfully" });
    });
  });

  describe("getMyCompany", () => {
    it("should return user's company if relation exists", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.getCompanyById as jest.Mock).mockResolvedValue(mockCompany);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, mockRes);

      expect(success).toHaveBeenCalledWith(mockRes, mockCompany);
    });

    it("should return 404 if no relation found", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([]);

      await UserCompanyController.getMyCompany({ user: { address: "0xUSER1" } } as any, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "No company relation found", 404);
    });
  });

  describe("updateMyCompany", () => {
    it("should update company if user is owner", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([mockRelation]);
      (CompanyService.updateCompany as jest.Mock).mockResolvedValue(mockCompany);

      await UserCompanyController.updateMyCompany(
        { user: { address: "0xUSER1" }, body: { name: "New Company" } } as any,
        mockRes
      );

      expect(CompanyService.updateCompany).toHaveBeenCalledWith("comp1", { name: "New Company" }, "0xUSER1");
      expect(success).toHaveBeenCalledWith(mockRes, mockCompany);
    });

    it("should return 403 if user is not owner", async () => {
      (UserCompanyService.getByUser as jest.Mock).mockResolvedValue([{ ...mockRelation, role: "member" }]);

      await UserCompanyController.updateMyCompany(
        { user: { address: "0xUSER1" }, body: {} } as any,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Only company owner can update company data", 403);
    });
  });
});
