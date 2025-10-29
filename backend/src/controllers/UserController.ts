import type { Request, Response } from "express"
import type { AuthRequest } from "../middlewares/authMiddleware.js"
import { UserService } from "../services/userService.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

// --- Wallet Connect / Auto-register ---
export async function walletConnectHandler(req: Request, res: Response) {
  try {
    const { user, token } = await UserService.walletConnect(req.body)
    return success(res, { user, token })
  } catch (err) {
    return handleError(res, err, "Wallet connect failed", 400)
  }
}

// --- Get current user ---
export async function getCurrentUserHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return failure(res, "User not authenticated", 401)
    return success(res, user)
  } catch (err) {
    return handleError(res, err, "Failed to fetch current user")
  }
}

// --- Get All Users (Admin Only) ---
export async function getAllUsersHandler(_req: Request, res: Response) {
  try {
    const users = await UserService.getAllUsers()
    return success(res, users)
  } catch (err) {
    return handleError(res, err, "Failed to fetch users")
  }
}

// --- Get Single User ---
export async function getUserHandler(req: Request, res: Response) {
  try {
    const user = await UserService.getUser(req.params.address)
    if (!user) return failure(res, "User not found", 404)
    return success(res, user)
  } catch (err) {
    return handleError(res, err, "Failed to fetch user")
  }
}

// --- Update User Role / Metadata ---
export async function updateUserHandler(req: Request, res: Response) {
  try {
    const updated = await UserService.updateUser(req.params.address, req.body)
    if (!updated) return failure(res, "User not found", 404)
    return success(res, updated)
  } catch (err) {
    return handleError(res, err, "Failed to update user", 400)
  }
}

// --- Update current user's own profile ---
export async function updateMeHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return failure(res, "Unauthorized", 401)

    const updated = await UserService.updateUser(user.address, req.body)
    if (!updated) return failure(res, "User not found", 404)
    return success(res, updated)
  } catch (err) {
    return handleError(res, err, "Failed to update profile", 400)
  }
}

// --- Delete User ---
export async function deleteUserHandler(req: Request, res: Response) {
  try {
    const deleted = await UserService.deleteUser(req.params.address)
    if (!deleted) return failure(res, "User not found", 404)
    return success(res, { message: "User deleted successfully" })
  } catch (err) {
    return handleError(res, err, "Failed to delete user")
  }
}
