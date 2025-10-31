import { Router } from "express"
import {
  walletConnectHandler,
  getCurrentUserHandler,
  getAllUsersHandler,
  getUserHandler,
  updateUserHandler,
  updateMeHandler,
  deleteUserHandler,
} from "../controllers/UserController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router();

/**
 * --- User Routes ---
 * Wallet connection, user profile management, admin user management
 */

/**
 * POST /users/wallet-connect
 * Wallet connect / auto-register user
 */
router.post("/wallet-connect", walletConnectHandler);

/**
 * GET /users/me
 * Get current authenticated user's profile
 */
router.get("/me", authMiddleware, getCurrentUserHandler);

/**
 * GET /users
 * Get all users (requires authentication)
 */
router.get("/", authMiddleware, getAllUsersHandler);

/**
 * GET /users/:address
 * Get single user by wallet address
 */
router.get("/:address", authMiddleware, getUserHandler);

/**
 * PATCH /users/update/me
 * Update current authenticated user's profile
 */
router.patch("/update/me", authMiddleware, updateMeHandler);

/**
 * PATCH /users/:address
 * Update user (admin only)
 */
router.patch("/:address", authMiddleware, adminMiddleware, updateUserHandler);

/**
 * DELETE /users/:address
 * Delete user (admin only)
 */
router.delete("/:address", authMiddleware, adminMiddleware, deleteUserHandler);

export default router;
