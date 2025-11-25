/**
 * @file userController.test.ts
 * @description Unit tests for userController
 */

import { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/authMiddleware";
import * as UserController from "../userController";
import { UserService } from "../../services/userService";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/userService");
jest.mock("../../utils/responseHelper");

/** Helper untuk mock response */
function createMockResponse(): jest.Mocked<Partial<Response>> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
}

describe("UserController", () => {
  let res: jest.Mocked<Response>;
  const mockUser = { address: "0xUSER1", name: "Alice" };
  const mockUsers = [mockUser];

  beforeEach(() => {
    res = createMockResponse() as jest.Mocked<Response>;
    jest.clearAllMocks();
  });

  describe("walletConnectHandler", () => {
    it("should connect wallet and return user & token", async () => {
      (UserService.walletConnect as jest.Mock).mockResolvedValue({ user: mockUser, token: "token123" });

      await UserController.walletConnectHandler({ body: { address: "0xUSER1" } } as unknown as Request, res);

      expect(UserService.walletConnect).toHaveBeenCalledWith({ address: "0xUSER1" });
      expect(success).toHaveBeenCalledWith(res, { data: mockUser, token: "token123" }, 201);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      (UserService.walletConnect as jest.Mock).mockRejectedValue(err);

      await UserController.walletConnectHandler({ body: {} } as Request, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Wallet connect failed", 400);
    });
  });

  describe("getCurrentUserHandler", () => {
    it("should return current user", async () => {
      const req = { user: mockUser } as unknown as AuthRequest;
      await UserController.getCurrentUserHandler(req, res);
      expect(success).toHaveBeenCalledWith(res, mockUser, 200);
    });

    it("should fail if no user", async () => {
      const req = { user: null } as unknown as AuthRequest;
      await UserController.getCurrentUserHandler(req, res);
      expect(failure).toHaveBeenCalledWith(res, "User not authenticated", 401);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      const req = { 
        get user() { throw err; }
      } as unknown as AuthRequest;

      await UserController.getCurrentUserHandler(req, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch current user", 500);
    });
  });

  describe("getAllUsersHandler", () => {
    it("should return all users", async () => {
      (UserService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      await UserController.getAllUsersHandler({} as Request, res);
      expect(UserService.getAllUsers).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(res, mockUsers, 200);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      (UserService.getAllUsers as jest.Mock).mockRejectedValue(err);
      await UserController.getAllUsersHandler({} as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch users", 500);
    });
  });

  describe("getUserHandler", () => {
    it("should return a user by address", async () => {
      (UserService.getUser as jest.Mock).mockResolvedValue(mockUser);
      await UserController.getUserHandler({ params: { address: "0xUSER1" } } as unknown as Request, res);
      expect(UserService.getUser).toHaveBeenCalledWith("0xUSER1");
      expect(success).toHaveBeenCalledWith(res, mockUser, 200);
    });

    it("should return 404 if user not found", async () => {
      (UserService.getUser as jest.Mock).mockResolvedValue(null);
      await UserController.getUserHandler({ params: { address: "0xUSER999" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "User not found", 404);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      (UserService.getUser as jest.Mock).mockRejectedValue(err);
      await UserController.getUserHandler({ params: { address: "0xUSER1" } } as unknown as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch user", 500);
    });
  });

  describe("updateUserHandler", () => {
    it("should update a user", async () => {
      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);
      await UserController.updateUserHandler({ params: { address: "0xUSER1" }, body: { name: "Bob" } } as unknown as Request, res);
      expect(UserService.updateUser).toHaveBeenCalledWith("0xUSER1", { name: "Bob" });
      expect(success).toHaveBeenCalledWith(res, mockUser, 200);
    });

    it("should return 404 if user not found", async () => {
      (UserService.updateUser as jest.Mock).mockResolvedValue(null);
      await UserController.updateUserHandler({ params: { address: "0xUSER999" }, body: {} } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "User not found", 404);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      (UserService.updateUser as jest.Mock).mockRejectedValue(err);
      await UserController.updateUserHandler({ params: { address: "0xUSER1" }, body: {} } as unknown as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update user", 400);
    });
  });

  describe("updateMeHandler", () => {
    it("should update own profile", async () => {
      const req = { user: mockUser, body: { name: "Bob" } } as unknown as AuthRequest;
      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);
      await UserController.updateMeHandler(req, res);
      expect(UserService.updateUser).toHaveBeenCalledWith("0xUSER1", { name: "Bob" });
      expect(success).toHaveBeenCalledWith(res, mockUser, 200);
    });

    it("should return 401 if no auth", async () => {
      const req = { user: null, body: {} } as unknown as AuthRequest;
      await UserController.updateMeHandler(req, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing or invalid Authorization header", 401);
    });

    it("should return 404 if user not found", async () => {
      const req = { user: mockUser, body: {} } as unknown as AuthRequest;
      (UserService.updateUser as jest.Mock).mockResolvedValue(null);
      await UserController.updateMeHandler(req, res);
      expect(failure).toHaveBeenCalledWith(res, "User not found", 404);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      const req = { user: mockUser, body: {} } as unknown as AuthRequest;
      (UserService.updateUser as jest.Mock).mockRejectedValue(err);
      await UserController.updateMeHandler(req, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update profile", 400);
    });
  });

  describe("deleteUserHandler", () => {
    it("should delete a user", async () => {
      (UserService.deleteUser as jest.Mock).mockResolvedValue(true);
      await UserController.deleteUserHandler({ params: { address: "0xUSER1" } } as unknown as Request, res);
      expect(UserService.deleteUser).toHaveBeenCalledWith("0xUSER1");
      expect(success).toHaveBeenCalledWith(res, { message: "User deleted successfully" }, 200);
    });

    it("should return 404 if user not found", async () => {
      (UserService.deleteUser as jest.Mock).mockResolvedValue(false);
      await UserController.deleteUserHandler({ params: { address: "0xUSER999" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "User not found", 404);
    });

    it("should handle error", async () => {
      const err = new Error("fail");
      (UserService.deleteUser as jest.Mock).mockRejectedValue(err);
      await UserController.deleteUserHandler({ params: { address: "0xUSER1" } } as unknown as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to delete user", 500);
    });
  });
});
