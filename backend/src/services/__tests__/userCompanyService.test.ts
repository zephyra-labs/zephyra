/**
 * @file UserCompanyService.test.ts
 * @description Unit tests for UserCompanyService using Jest.
 * Tests cover create, update, delete, and retrieval methods with
 * manual mocks for models and notification helper.
 */

import { UserCompanyService } from "../../services/userCompanyService";
import { notifyWithAdmins } from "../../utils/notificationHelper";
import { UserCompanyModel } from "../../models/userCompanyModel";

// 🔹 Manual mocks for model and helper
jest.mock("../../models/userCompanyModel", () => ({
  UserCompanyModel: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
    getByUser: jest.fn(),
    getByCompany: jest.fn(),
    getAllFiltered: jest.fn(),
  },
}));

jest.mock("../../utils/notificationHelper", () => ({
  notifyWithAdmins: jest.fn(),
}));

/**
 * Unit tests for UserCompanyService.
 */
describe("UserCompanyService", () => {
  const mockRelation = {
    id: "rel1",
    userAddress: "0xABC",
    companyId: "c123",
    role: "member",
    joinedAt: Date.now(),
  };

  beforeEach(() => {
    // Clear all mocks before each test to prevent interference
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for creating a new UserCompany relation
   */
  describe("createUserCompany", () => {
    it("should create relation and notify admins", async () => {
      (UserCompanyModel.getByUser as jest.Mock).mockResolvedValue([]);
      (UserCompanyModel.create as jest.Mock).mockResolvedValue(mockRelation);

      const result = await UserCompanyService.createUserCompany({
        userAddress: "0xABC",
        companyId: "c123",
        joinedAt: Date.now(),
      });

      expect(UserCompanyModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userAddress: "0xABC",
          companyId: "c123",
        }),
      );

      expect(notifyWithAdmins).toHaveBeenCalledWith(
        "0xABC",
        expect.objectContaining({
          type: "user_company",
          title: expect.any(String),
          message: expect.any(String),
          data: mockRelation,
        }),
      );

      expect(result).toEqual(mockRelation);
    });

    it("should throw if relation already exists", async () => {
      (UserCompanyModel.getByUser as jest.Mock).mockResolvedValue([{ companyId: "c123" }]);

      await expect(
        UserCompanyService.createUserCompany({
          userAddress: "0xABC",
          companyId: "c123",
          joinedAt: Date.now(),
        }),
      ).rejects.toThrow("Relation between user 0xABC and company c123 already exists");
    });

    it("should throw if userAddress is missing", async () => {
      await expect(
        UserCompanyService.createUserCompany({ companyId: "c123" } as any),
      ).rejects.toThrow("userAddress is required");
    });

    it("should throw if companyId is missing", async () => {
      await expect(
        UserCompanyService.createUserCompany({ userAddress: "0xABC" } as any),
      ).rejects.toThrow("companyId is required");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for updating an existing UserCompany relation
   */
  describe("updateUserCompany", () => {
    it("should update and notify admins", async () => {
      (UserCompanyModel.update as jest.Mock).mockResolvedValue(mockRelation);

      const result = await UserCompanyService.updateUserCompany("rel1", { role: "owner" });

      expect(UserCompanyModel.update).toHaveBeenCalledWith("rel1", { role: "owner" });
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        "0xABC",
        expect.objectContaining({
          type: "user_company",
          title: expect.any(String),
          message: expect.any(String),
          data: mockRelation,
        }),
      );
      expect(result).toEqual(mockRelation);
    });

    it("should throw if not found", async () => {
      (UserCompanyModel.update as jest.Mock).mockResolvedValue(null);

      await expect(
        UserCompanyService.updateUserCompany("missing", { role: "owner" }),
      ).rejects.toThrow("UserCompany not found");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for deleting a UserCompany relation
   */
  describe("deleteUserCompany", () => {
    it("should delete and notify admins", async () => {
      (UserCompanyModel.getById as jest.Mock).mockResolvedValue(mockRelation);
      (UserCompanyModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await UserCompanyService.deleteUserCompany("rel1");

      expect(UserCompanyModel.getById).toHaveBeenCalledWith("rel1");
      expect(UserCompanyModel.delete).toHaveBeenCalledWith("rel1");
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        "0xABC",
        expect.objectContaining({
          type: "user_company",
          title: expect.any(String),
          message: expect.any(String),
          data: mockRelation,
        }),
      );
      expect(result).toBe(true);
    });

    it("should throw if relation not found", async () => {
      (UserCompanyModel.getById as jest.Mock).mockResolvedValue(null);

      await expect(
        UserCompanyService.deleteUserCompany("relX"),
      ).rejects.toThrow("UserCompany not found");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for retrieval methods: getAllFiltered, getById, getByUser, getByCompany
   */
  describe("getAllFiltered / getById / getByUser / getByCompany", () => {
    it("should call getAllFiltered", async () => {
      (UserCompanyModel.getAllFiltered as jest.Mock).mockResolvedValue({ data: [mockRelation], total: 1 });

      const result = await UserCompanyService.getAllFiltered({ page: 1, limit: 10 });
      expect(UserCompanyModel.getAllFiltered).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.data).toEqual([mockRelation]);
      expect(result.total).toBe(1);
    });

    it("should call getById", async () => {
      (UserCompanyModel.getById as jest.Mock).mockResolvedValue(mockRelation);

      const result = await UserCompanyService.getById("rel1");
      expect(UserCompanyModel.getById).toHaveBeenCalledWith("rel1");
      expect(result).toEqual(mockRelation);
    });

    it("should call getByUser", async () => {
      (UserCompanyModel.getByUser as jest.Mock).mockResolvedValue([mockRelation]);

      const result = await UserCompanyService.getByUser("0xABC");
      expect(UserCompanyModel.getByUser).toHaveBeenCalledWith("0xABC");
      expect(result).toEqual([mockRelation]);
    });

    it("should call getByCompany", async () => {
      (UserCompanyModel.getByCompany as jest.Mock).mockResolvedValue([mockRelation]);

      const result = await UserCompanyService.getByCompany("c123");
      expect(UserCompanyModel.getByCompany).toHaveBeenCalledWith("c123");
      expect(result).toEqual([mockRelation]);
    });
  });
});
