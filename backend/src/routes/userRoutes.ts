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
 *       200:
 *         description: Success response with user data and JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserDTO'
 *                 token:
 *                   type: string
 */
router.post("/wallet-connect", walletConnectHandler);

/**
 * Get current user profile
 * @swagger
 * /api/user/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 */
router.get("/me", authMiddleware, getCurrentUserHandler);

/**
 * Get all users
 * @swagger
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserDTO'
 */
router.get("/", authMiddleware, getAllUsersHandler);

/**
 * Get single user by address
 * @swagger
 * /api/user/{address}:
 *   get:
 *     tags: [Users]
 *     summary: Get single user by wallet address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 */
router.get("/:address", authMiddleware, getUserHandler);

/**
 * Update current user profile
 * @swagger
 * /api/user/update/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDTO'
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 */
router.patch("/update/me", authMiddleware, updateMeHandler);

/**
 * Update user (admin only)
 * @swagger
 * /api/user/{address}:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Update user (admin only)
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
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 */
router.patch("/:address", authMiddleware, adminMiddleware, updateUserHandler);

/**
 * Delete user (admin only)
 * @swagger
 * /api/user/{address}:
 *   delete:
 *     tags: [Admin Users]
 *     summary: Delete user (admin only)
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
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.delete("/:address", authMiddleware, adminMiddleware, deleteUserHandler);

export default router;
