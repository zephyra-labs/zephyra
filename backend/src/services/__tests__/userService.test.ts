/**
 * @file userService.test.ts
 * @description Full coverage unit tests for UserService using Jest.
 * Tests cover create, read, update, delete, walletConnect, updateMe, updateKYCStatus, getAllUsers.
 */

import { UserService } from "../userService";
import { UserModel } from "../../models/userModel";
import { notifyWithAdmins } from "../../utils/notificationHelper";
import { CompanyService } from "../companyService";
import { UserCompanyService } from "../userCompanyService";
import jwt from "jsonwebtoken";

jest.mock("../../models/userModel.ts");
jest.mock("../../utils/notificationHelper.ts");
jest.mock("../companyService.ts");
jest.mock("../userCompanyService.ts");
jest.mock("jsonwebtoken");

describe("UserService - full coverage", () => {
  const mockUser = { address: "0xABC123", email: "ajax@example.com", metadata: { name: "Ajax" } };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  // ───────────────────────────────────────────────
  describe("createUser", () => {
    it("creates a new user and notifies admins", async () => {
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser({ address: mockUser.address });

      expect(UserModel.create).toHaveBeenCalledWith(expect.any(Object));
      expect(notifyWithAdmins).toHaveBeenCalledWith(
        mockUser.address,
        expect.objectContaining({ type: "user", title: expect.stringContaining("User Created") })
      );
      expect(result).toEqual(mockUser);
    });

    it("throws if address missing", async () => {
      await expect(UserService.createUser({} as any)).rejects.toThrow("Address is required");
    });
  });

  // ───────────────────────────────────────────────
  describe("getUser", () => {
    it("returns user if found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      const result = await UserService.getUser(mockUser.address);
      expect(result).toEqual(mockUser);
    });

    it("returns null if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      const result = await UserService.getUser("0xNOTFOUND");
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────
  describe("updateUser", () => {
    it("updates user and notifies admins", async () => {
      const updatedUser = { ...mockUser, metadata: { name: "Updated" } };
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(mockUser.address, { metadata: { name: "Updated" } });

      expect(UserModel.update).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it("throws if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(UserService.updateUser("0xNOTFOUND", { metadata: { name: "Test" } })).rejects.toThrow(
        "User not found"
      );
    });

    it("does not notify if update fails (returns null)", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(null);

      const result = await UserService.updateUser(mockUser.address, { metadata: { name: "Fail" } });
      expect(result).toBeNull();
      expect(notifyWithAdmins).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────
  describe("deleteUser", () => {
    it("deletes user and notifies admins", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await UserService.deleteUser(mockUser.address);

      expect(UserModel.delete).toHaveBeenCalledWith(mockUser.address);
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("throws if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(UserService.deleteUser("0xNOTFOUND")).rejects.toThrow("User not found");
    });

    it("skips notify if delete fails", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.delete as jest.Mock).mockResolvedValue(false);

      const result = await UserService.deleteUser(mockUser.address);
      expect(result).toBe(false);
      expect(notifyWithAdmins).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────
  describe("walletConnect", () => {
    let newUser: any;

    beforeEach(() => {
      newUser = { ...mockUser, id: "u123" };
      (jwt.sign as jest.Mock).mockReturnValue("mock-token");
    });

    it("creates new user, company, and user-company relation", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(newUser);
      (CompanyService.createDefaultForUser as jest.Mock).mockResolvedValue({ id: "c1" });
      (UserCompanyService.createUserCompany as jest.Mock).mockResolvedValue(true);

      const result = await UserService.walletConnect({ address: newUser.address });

      expect(UserModel.create).toHaveBeenCalled();
      expect(CompanyService.createDefaultForUser).toHaveBeenCalledWith(newUser.address);
      expect(UserCompanyService.createUserCompany).toHaveBeenCalled();
      expect(result.user).toEqual(newUser);
      expect(result.token).toBe("mock-token");
    });

    it("updates existing user login if found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.walletConnect({ address: mockUser.address });

      expect(UserModel.update).toHaveBeenCalled();
      expect(result.token).toBe("mock-token");
    });

    it("throws if address missing", async () => {
      await expect(UserService.walletConnect({} as any)).rejects.toThrow("Address is required");
    });

    it("returns old user if update fails", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue(null);
      const result = await UserService.walletConnect({ address: mockUser.address });
      expect(result.user).toEqual(mockUser);
    });

    it("skips creating user-company relation if company has no id", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(newUser);
      (CompanyService.createDefaultForUser as jest.Mock).mockResolvedValue({}); // no id

      const result = await UserService.walletConnect({ address: newUser.address });
      expect(UserCompanyService.createUserCompany).not.toHaveBeenCalled();
      expect(result.user).toEqual(newUser);
    });

    it("generates token with empty string if JWT_SECRET undefined", async () => {
      delete process.env.JWT_SECRET;
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(newUser);
      (CompanyService.createDefaultForUser as jest.Mock).mockResolvedValue({ id: "c1" });
      (UserCompanyService.createUserCompany as jest.Mock).mockResolvedValue(true);

      const result = await UserService.walletConnect({ address: newUser.address });

      expect(jwt.sign).toHaveBeenCalledWith({ address: newUser.address }, "", { expiresIn: "7d" });
      expect(result.token).toBe("mock-token");
    });
  });

  // ───────────────────────────────────────────────
  describe("updateMe", () => {
    it("updates metadata successfully", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue({ ...mockUser, metadata: { name: "Updated" } });

      const updated = await UserService.updateMe(mockUser.address, { name: "Updated" });
      expect(UserModel.update).toHaveBeenCalledWith(mockUser.address, { metadata: { name: "Updated" } });
      expect(updated?.metadata?.name).toBe("Updated");
    });

    it("throws if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(UserService.updateMe("0xNOEXIST", { name: "Test" })).rejects.toThrow("User not found");
    });
  });

  // ───────────────────────────────────────────────
  describe("updateKYCStatus", () => {
    it("updates KYC status", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.update as jest.Mock).mockResolvedValue({ ...mockUser, metadata: { kycStatus: "approved" } });

      const updated = await UserService.updateKYCStatus(mockUser.address, "approved");
      expect(UserModel.update).toHaveBeenCalled();
      expect(updated?.metadata?.kycStatus).toBe("approved");
    });

    it("throws if user not found", async () => {
      (UserModel.getByAddress as jest.Mock).mockResolvedValue(null);
      await expect(UserService.updateKYCStatus("0xNOEXIST", "approved")).rejects.toThrow("User not found");
    });
  });

  // ───────────────────────────────────────────────
  describe("getAllUsers", () => {
    it("returns all users", async () => {
      (UserModel.getAll as jest.Mock).mockResolvedValue([mockUser]);
      const users = await UserService.getAllUsers();
      expect(users).toHaveLength(1);
      expect(users[0].address).toBe(mockUser.address);
    });
  });
});
