/**
 * @file userService.test.ts
 * @description Unit tests for UserService using Jest.
 * Tests cover create, read, update, delete, and walletConnect logic.
 * Mocks include UserModel, notificationHelper, CompanyService, UserCompanyService, and jwt.
 */

import { UserService } from "../userService";
import { UserModel } from "../../models/userModel";
import { notifyWithAdmins } from "../../utils/notificationHelper";
import { CompanyService } from "../companyService";
import { UserCompanyService } from "../userCompanyService";
import jwt from "jsonwebtoken";

// 🔹 Jest mocks for all dependencies
jest.mock("../../models/UserModel.ts");
jest.mock("../../utils/notificationHelper.ts");
jest.mock("../companyService.ts");
jest.mock("../userCompanyService.ts");
jest.mock("jsonwebtoken");

/**
 * Unit tests for UserService
 */
describe("UserService", () => {
  const mockUser = {
    address: "0xABC123",
    email: "ajax@example.com",
    metadata: { name: "Ajax" },
  };

  beforeEach(() => {
    // Reset all mocks and environment variables before each test
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for creating a new user
   */
  describe("createUser", () => {
    /**
     * Should create a new user and notify admins
     */
    it("should create a new user and notify admins", async () => {
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser({ address: mockUser.address });

      expect(UserModel.create).toHaveBeenCalledWith(expect.any(Object));
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        mockUser.address,
        expect.objectContaining({ type: "user", title: expect.stringContaining("User Created") })
      );
      expect(result).toEqual(mockUser);
    });

    /**
     * Should throw an error if address is missing
     */
    it("should throw if address is missing", async () => {
      await expect(UserService.createUser({} as any)).rejects.toThrow("Address is required");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for retrieving a user
   */
  describe("getUser", () => {
    it("should return a user if found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUser(mockUser.address);
      expect(result).toEqual(mockUser);
      expect(UserModel.getByAddress).toHaveBeenCalledWith(mockUser.address);
    });

    it("should return null if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);

      const result = await UserService.getUser("0xNOTFOUND");
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for updating an existing user
   */
  describe("updateUser", () => {
    it("should update an existing user and notify admins", async () => {
      const updatedUser = { ...mockUser, metadata: { name: "Updated" } };
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(mockUser.address, { metadata: { name: "Updated" } });

      expect(UserModel.update).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        updatedUser.address,
        expect.objectContaining({ title: expect.stringContaining("User Updated") })
      );
      expect(result).toEqual(updatedUser);
    });

    it("should throw if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(
        UserService.updateUser("0xNOTFOUND", { metadata: { name: "Test" } })
      ).rejects.toThrow("User not found");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for deleting a user
   */
  describe("deleteUser", () => {
    it("should delete an existing user and notify admins", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await UserService.deleteUser(mockUser.address);

      expect(UserModel.delete).toHaveBeenCalledWith(mockUser.address);
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        mockUser.address,
        expect.objectContaining({ title: expect.stringContaining("User Deleted") })
      );
      expect(result).toBe(true);
    });

    it("should throw if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(UserService.deleteUser("0xNOTFOUND")).rejects.toThrow("User not found");
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for walletConnect flow
   */
  describe("walletConnect", () => {
    it("should create new user, company, and user-company relation", async () => {
      const newUser = { ...mockUser, id: "u123" };
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(newUser);
      (CompanyService.createDefaultForUser as jest.Mock).mockResolvedValue({ id: "c1" });
      (UserCompanyService.createUserCompany as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-token");

      const result = await UserService.walletConnect({ address: newUser.address });

      expect(UserModel.create).toHaveBeenCalled();
      expect(CompanyService.createDefaultForUser).toHaveBeenCalledWith(newUser.address);
      expect(UserCompanyService.createUserCompany).toHaveBeenCalled();
      expect(result.token).toBe("mock-token");
      expect(result.user).toEqual(newUser);
    });

    it("should update existing user login if found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue("mock-token");

      const result = await UserService.walletConnect({ address: mockUser.address });

      expect(UserModel.update).toHaveBeenCalled();
      expect(result.token).toBe("mock-token");
    });

    it("should throw if address missing", async () => {
      await expect(UserService.walletConnect({} as any)).rejects.toThrow("Address is required");
    });
  });
});
