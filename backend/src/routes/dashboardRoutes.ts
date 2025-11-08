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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 */
router.get("/admin", authMiddleware, adminMiddleware, DashboardController.getDashboard);

/**
 * @swagger
 * /api/dashboard/user:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get personalized dashboard data for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 */
router.get("/user", authMiddleware, DashboardController.getUserDashboard);

export default router;
