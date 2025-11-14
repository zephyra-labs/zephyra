/**
 * @file userRoutes.ts
 * @description Express router for user-related endpoints with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import {
  walletConnectHandler,
  getCurrentUserHandler,
  getAllUsersHandler,
  getUserHandler,
  updateUserHandler,
  updateMeHandler,
  deleteUserHandler,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 * 
 *     UserDTO:
 *       type: object
 *       required:
 *         - address
 *       properties:
 *         address:
 *           type: string
 *           example: "0x123abc..."
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         lastLoginAt:
 *           type: integer
 *           example: 1699372800000
 *         metadata:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             kycStatus:
 *               type: string
 *               enum: [pending, approved, rejected]
 *               example: pending
 *
 *     CreateUserDTO:
 *       allOf:
 *         - $ref: '#/components/schemas/UserDTO'
 *       required:
 *         - address
 *
 *     UpdateUserDTO:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, admin]
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *         lastLoginAt:
 *           type: integer
 *         kycStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User deleted successfully"
 *
 * tags:
 *   - name: Users
 *     description: User profile and wallet connection endpoints
 *   - name: Admin Users
 *     description: Admin-only user management endpoints
 */

/**
 * Wallet connect / auto-register user
 * @swagger
 * /api/user/wallet-connect:
 *   post:
 *     tags: [Users]
 *     summary: Wallet connect / auto-register
 *     description: Automatically registers a user if the wallet address is new, or logs in existing user. Returns user data and JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 example: "0x123abc..."
 *     responses:
 *       201:
 *         description: User successfully connected via wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             example:
 *               success: true
 *               data:
 *                 address: "0x123abc..."
 *                 role: "user"
 *                 createdAt: 1699286400000
 *                 lastLoginAt: 1699372800000
 *                 metadata:
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   kycStatus: "pending"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *       400:
 *         description: Validation or wallet connection error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Wallet connect failed: invalid address"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid Authorization header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while processing wallet connect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post("/wallet-connect", walletConnectHandler);

/**
 * Get current user profile
 * @swagger
 * /api/user/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user's profile
 *     description: Returns the profile information of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *             example:
 *               success: true
 *               data:
 *                 address: "0x123abc..."
 *                 role: "user"
 *                 createdAt: 1699286400000
 *                 lastLoginAt: 1699372800000
 *                 metadata:
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   kycStatus: "pending"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not authenticated"
 *
 *       500:
 *         description: Server error while fetching user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch current user"
 */
router.get("/me", authMiddleware, getCurrentUserHandler);

/**
 * Get all users
 * @swagger
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Returns a list of all registered users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserDTO'
 *             example:
 *               success: true
 *               data:
 *                 - address: "0x123abc..."
 *                   role: "user"
 *                   createdAt: 1699286400000
 *                   lastLoginAt: 1699372800000
 *                   metadata:
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *                     kycStatus: "pending"
 *                 - address: "0x456def..."
 *                   role: "admin"
 *                   createdAt: 1699286500000
 *                   lastLoginAt: 1699372900000
 *                   metadata:
 *                     name: "Alice Smith"
 *                     email: "alice@example.com"
 *                     kycStatus: "approved"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while fetching users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch users"
 */
router.get("/", authMiddleware, getAllUsersHandler);

/**
 * Get single user by address
 * @swagger
 * /api/user/{address}:
 *   get:
 *     tags: [Users]
 *     summary: Get single user by wallet address
 *     description: Fetch a user profile using their wallet address.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *             example:
 *               success: true
 *               data:
 *                 address: "0x123abc..."
 *                 role: "user"
 *                 createdAt: 1699286400000
 *                 lastLoginAt: 1699372800000
 *                 metadata:
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   kycStatus: "pending"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 *
 *       500:
 *         description: Server error while fetching user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user"
 */
router.get("/:address", authMiddleware, getUserHandler);

/**
 * Update current user profile
 * @swagger
 * /api/user/update/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current authenticated user's profile
 *     description: Updates the profile data (metadata, role, lastLoginAt, kycStatus) of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDTO'
 *           example:
 *             role: "user"
 *             metadata:
 *               name: "Jane Doe"
 *               email: "jane@example.com"
 *             kycStatus: "approved"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *             example:
 *               success: true
 *               data:
 *                 address: "0x123abc..."
 *                 role: "user"
 *                 createdAt: 1699286400000
 *                 lastLoginAt: 1699372800000
 *                 metadata:
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   kycStatus: "approved"
 *
 *       400:
 *         description: Validation error or failed to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update profile"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 */
router.patch("/update/me", authMiddleware, updateMeHandler);

/**
 * Update user (admin only)
 * @swagger
 * /api/user/{address}:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Update a user's profile (admin only)
 *     description: Update metadata, role, lastLoginAt, or KYC status of a user. Admin privileges required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDTO'
 *           example:
 *             role: "admin"
 *             metadata:
 *               name: "Alice Admin"
 *               email: "alice@example.com"
 *             kycStatus: "approved"
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *             example:
 *               success: true
 *               data:
 *                 address: "0xabc123..."
 *                 role: "admin"
 *                 createdAt: 1699286400000
 *                 lastLoginAt: 1699372800000
 *                 metadata:
 *                   name: "Alice Admin"
 *                   email: "alice@example.com"
 *                   kycStatus: "approved"
 *
 *       400:
 *         description: Validation error or failed to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update user"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       403:
 *         description: Forbidden — Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Admin privileges required"
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 */
router.patch("/:address", authMiddleware, adminMiddleware, updateUserHandler);

/**
 * Delete user (admin only)
 * @swagger
 * /api/user/{address}:
 *   delete:
 *     tags: [Admin Users]
 *     summary: Delete a user (admin only)
 *     description: Admin-only endpoint to remove a user by their wallet address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "User deleted successfully"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       403:
 *         description: Forbidden — Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Admin privileges required"
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 *
 *       500:
 *         description: Server error while deleting user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete user"
 */
router.delete("/:address", authMiddleware, adminMiddleware, deleteUserHandler);

export default router;
