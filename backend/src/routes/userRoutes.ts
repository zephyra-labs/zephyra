/**
 * @file userRoutes.ts
 * @description Express router for user-related endpoints, including wallet connection,
 * user profile management, and admin user management.
 */

import { Router } from "express"
import {
  walletConnectHandler,
  getCurrentUserHandler,
  getAllUsersHandler,
  getUserHandler,
  updateUserHandler,
  updateMeHandler,
  deleteUserHandler,
} from "../controllers/userController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router();

/**
 * --- User Routes ---
 * Wallet connection, user profile management, admin user management
 */

/**
 * Wallet connect / auto-register user
 * @route POST /users/wallet-connect
 * @group Users
 * @returns {object} 200 - Success response with user data
 */
router.post("/wallet-connect", walletConnectHandler);

/**
 * Get current authenticated user's profile
 * @route GET /users/me
 * @group Users
 * @security BearerAuth
 * @returns {object} 200 - User profile
 */
router.get("/me", authMiddleware, getCurrentUserHandler);

/**
 * Get all users (requires authentication)
 * @route GET /users
 * @group Users
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of users
 */
router.get("/", authMiddleware, getAllUsersHandler);

/**
 * Get single user by wallet address
 * @route GET /users/:address
 * @group Users
 * @security BearerAuth
 * @param {string} address.path.required - Wallet address
 * @returns {object} 200 - User profile
 */
router.get("/:address", authMiddleware, getUserHandler);

/**
 * Update current authenticated user's profile
 * @route PATCH /users/update/me
 * @group Users
 * @security BearerAuth
 * @param {object} body - Partial user data to update
 * @returns {object} 200 - Updated user profile
 */
router.patch("/update/me", authMiddleware, updateMeHandler);

/**
 * Update user (admin only)
 * @route PATCH /users/:address
 * @group Admin Users
 * @security BearerAuth
 * @param {string} address.path.required - Wallet address of the user
 * @param {object} body - Fields to update
 * @returns {object} 200 - Updated user profile
 */
router.patch("/:address", authMiddleware, adminMiddleware, updateUserHandler);

/**
 * Delete user (admin only)
 * @route DELETE /users/:address
 * @group Admin Users
 * @security BearerAuth
 * @param {string} address.path.required - Wallet address of the user
 * @returns {object} 200 - Success message
 */
router.delete("/:address", authMiddleware, adminMiddleware, deleteUserHandler);

export default router;
