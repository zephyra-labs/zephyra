/**
 * @file userController.ts
 * @description Express controller for user-related endpoints: wallet connect, CRUD, profile update.
 */

import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware";
import { UserService } from "../services/userService";
import { success, failure, handleError } from "../utils/responseHelper";

/**
 * Wallet connect / auto-register handler.
 *
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with user and token.
 */
export async function walletConnectHandler(req: Request, res: Response) {
  try {
    const { user, token } = await UserService.walletConnect(req.body);
    return success(res, { data: user, token });
  } catch (err) {
    return handleError(res, err, "Wallet connect failed", 400);
  }
}

/**
 * Get current authenticated user.
 *
 * @async
 * @param {AuthRequest} req - Request with authenticated user attached.
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function getCurrentUserHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return failure(res, "User not authenticated", 401);
    return success(res, user);
  } catch (err) {
    return handleError(res, err, "Failed to fetch current user");
  }
}

/**
 * Get all users (Admin only).
 *
 * @async
 * @param {Request} _req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function getAllUsersHandler(_req: Request, res: Response) {
  try {
    const users = await UserService.getAllUsers();
    return success(res, users);
  } catch (err) {
    return handleError(res, err, "Failed to fetch users");
  }
}

/**
 * Get a single user by wallet address.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function getUserHandler(req: Request, res: Response) {
  try {
    const user = await UserService.getUser(req.params.address);
    if (!user) return failure(res, "User not found", 404);
    return success(res, user);
  } catch (err) {
    return handleError(res, err, "Failed to fetch user");
  }
}

/**
 * Update a user by wallet address (roles/metadata).
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function updateUserHandler(req: Request, res: Response) {
  try {
    const updated = await UserService.updateUser(req.params.address, req.body);
    if (!updated) return failure(res, "User not found", 404);
    return success(res, updated);
  } catch (err) {
    return handleError(res, err, "Failed to update user", 400);
  }
}

/**
 * Update current user's own profile.
 *
 * @async
 * @param {AuthRequest} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function updateMeHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return failure(res, "Unauthorized", 401);

    const updated = await UserService.updateUser(user.address, req.body);
    if (!updated) return failure(res, "User not found", 404);
    return success(res, updated);
  } catch (err) {
    return handleError(res, err, "Failed to update profile", 400);
  }
}

/**
 * Delete a user by wallet address.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export async function deleteUserHandler(req: Request, res: Response) {
  try {
    const deleted = await UserService.deleteUser(req.params.address);
    if (!deleted) return failure(res, "User not found", 404);
    return success(res, { message: "User deleted successfully" });
  } catch (err) {
    return handleError(res, err, "Failed to delete user");
  }
}
