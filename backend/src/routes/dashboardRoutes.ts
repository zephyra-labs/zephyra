/**
 * @file dashboardRoutes.ts
 * @description Routes for fetching dashboard data for admins and users with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController";
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
 *     DashboardWallet:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           example: "0xabc123..."
 *         balance:
 *           type: number
 *           example: 1000000000
 *
 *     DashboardContractLastAction:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         account:
 *           type: string
 *         timestamp:
 *           type: integer
 *
 *     DashboardContract:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *         owner:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastAction:
 *           $ref: '#/components/schemas/DashboardContractLastAction'
 *
 *     DashboardDocumentLastAction:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         account:
 *           type: string
 *         timestamp:
 *           type: integer
 *
 *     DashboardDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tokenId:
 *           type: integer
 *         owner:
 *           type: string
 *         title:
 *           type: string
 *         docType:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: integer
 *         updatedAt:
 *           type: integer
 *         lastAction:
 *           $ref: '#/components/schemas/DashboardDocumentLastAction'
 *
 *     DashboardData:
 *       type: object
 *       properties:
 *         totalWallets:
 *           type: integer
 *         totalContracts:
 *           type: integer
 *         totalDocuments:
 *           type: integer
 *         wallets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardWallet'
 *         recentContracts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardContract'
 *         recentDocuments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardDocument'
 *
 * tags:
 *   - name: Dashboard
 *     description: Admin and user dashboard endpoints
 */

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get system-wide dashboard data (Admin only)
 *     description: Retrieve dashboard metrics for admin users, including total wallets, contracts, documents, and recent entries.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 *             examples:
 *               success:
 *                 summary: Example admin dashboard response
 *                 value:
 *                   success: true
 *                   data:
 *                     totalWallets: 12
 *                     totalContracts: 8
 *                     totalDocuments: 25
 *                     wallets:
 *                       - address: "0xabc123..."
 *                         balance: 1000000000
 *                       - address: "0xdef456..."
 *                         balance: 500000000
 *                     recentContracts:
 *                       - address: "0xContractAddress1"
 *                         owner: "0xOwner1"
 *                         createdAt: "2025-11-10T08:00:00Z"
 *                         lastAction:
 *                           action: "created"
 *                           account: "0xOwner1"
 *                           timestamp: 1699603200000
 *                       - address: "0xContractAddress2"
 *                         owner: "0xOwner2"
 *                         createdAt: "2025-11-11T09:30:00Z"
 *                         lastAction:
 *                           action: "shipped"
 *                           account: "0xLogistics1"
 *                           timestamp: 1699689600000
 *                     recentDocuments:
 *                       - id: "doc-123"
 *                         tokenId: 1
 *                         owner: "0xOwner1"
 *                         title: "Contract Agreement"
 *                         docType: "PDF"
 *                         status: "active"
 *                         createdAt: 1699599600000
 *                         updatedAt: 1699603200000
 *                         lastAction:
 *                           action: "uploaded"
 *                           account: "0xOwner1"
 *                           timestamp: 1699603200000
 *
 *       400:
 *         description: Bad request — malformed input or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid request format"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Dashboard data not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Dashboard data not found"
 *
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "Limit must be a number"
 *
 *       500:
 *         description: Server error while fetching dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch admin dashboard"
 */
router.get("/admin", authMiddleware, adminMiddleware, DashboardController.getDashboard);

/**
 * @swagger
 * /api/dashboard/user:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get personalized dashboard data for the current user
 *     description: Retrieve dashboard metrics for the authenticated user, including their wallets, contracts, and documents.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 *             examples:
 *               success:
 *                 summary: Example user dashboard response
 *                 value:
 *                   success: true
 *                   data:
 *                     totalWallets: 3
 *                     totalContracts: 2
 *                     totalDocuments: 5
 *                     wallets:
 *                       - address: "0xUserWallet1"
 *                         balance: 500000000
 *                       - address: "0xUserWallet2"
 *                         balance: 250000000
 *                     recentContracts:
 *                       - address: "0xContractUser1"
 *                         owner: "0xUserWallet1"
 *                         createdAt: "2025-11-12T10:00:00Z"
 *                         lastAction:
 *                           action: "approved"
 *                           account: "0xUserWallet1"
 *                           timestamp: 1700000000000
 *                     recentDocuments:
 *                       - id: "doc-201"
 *                         tokenId: 101
 *                         owner: "0xUserWallet1"
 *                         title: "User Contract"
 *                         docType: "PDF"
 *                         status: "active"
 *                         createdAt: 1700000000000
 *                         updatedAt: 1700003600000
 *                         lastAction:
 *                           action: "uploaded"
 *                           account: "0xUserWallet1"
 *                           timestamp: 1700003600000
 *
 *       400:
 *         description: Bad request — malformed input or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid request format"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized: missing user address"
 *
 *       404:
 *         description: User dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User dashboard data not found"
 *
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "Validation error"
 *               errors:
 *                 - field: "wallet"
 *                   message: "Invalid wallet address format"
 *
 *       500:
 *         description: Server error while fetching user dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user dashboard"
 */
router.get("/user", authMiddleware, DashboardController.getUserDashboard);

export default router;
