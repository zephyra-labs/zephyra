/**
 * @file reportRoutes.ts
 * @description Express routes for reporting endpoints with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import { ReportController } from "../controllers/reportController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reporting and analytics endpoints
 */

/**
 * @swagger
 * /api/reports/history:
 *   get:
 *     tags: [Reports]
 *     summary: Get trade history with pagination and filters
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: from
 *         schema:
 *           type: number
 *         description: Start timestamp filter
 *         example: 1700000000000
 *       - in: query
 *         name: to
 *         schema:
 *           type: number
 *         description: End timestamp filter
 *         example: 1700500000000
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 *         description: Filter by trade status
 *         example: Completed
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user address
 *         example: "0xUser1"
 *
 *     responses:
 *       200:
 *         description: Paginated trade history response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tradeId:
 *                         type: string
 *                       user:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: number
 *             example:
 *               page: 1
 *               limit: 10
 *               total: 34
 *               records:
 *                 - tradeId: "trade-123"
 *                   user: "0xUser1"
 *                   status: "Completed"
 *                   createdAt: 1700020000000
 *
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Invalid pagination params"
 *
 *       500:
 *         description: Failed to fetch trade history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Failed to fetch trade history"
 */
router.get("/history", authMiddleware, ReportController.getTradeHistory);

/**
 * @swagger
 * /api/reports/performance:
 *   get:
 *     tags: [Reports]
 *     summary: Get aggregated performance metrics
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: number
 *         description: Start timestamp filter
 *         example: 1700000000000
 *       - in: query
 *         name: to
 *         schema:
 *           type: number
 *         description: End timestamp filter
 *         example: 1700500000000
 *
 *     responses:
 *       200:
 *         description: Aggregated performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avgCompletionTime:
 *                   type: number
 *                 topUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                 timeline:
 *                   type: array
 *             example:
 *               avgCompletionTime: 15400
 *               topUsers:
 *                 - user: "0xUser1"
 *                   completed: 45
 *                 - user: "0xUser2"
 *                   completed: 32
 *               timeline:
 *                 - date: "2025-01-01"
 *                   count: 12
 *                 - date: "2025-01-02"
 *                   count: 9
 *
 *       400:
 *         description: Invalid filter parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       500:
 *         description: Failed to fetch performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/performance", authMiddleware, ReportController.getPerformanceReport);

/**
 * @swagger
 * /api/reports/main:
 *   get:
 *     tags: [Reports]
 *     summary: Get main dashboard report
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: number
 *         description: Start timestamp filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: number
 *         description: End timestamp filter
 *
 *     responses:
 *       200:
 *         description: Main aggregated system report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               totalTrades: 1221
 *               completedTrades: 1044
 *               failedTrades: 55
 *               activeUsers: 88
 *               completionRate: 0.92
 *
 *       400:
 *         description: Invalid date filter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       500:
 *         description: Failed to fetch main report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/main", authMiddleware, ReportController.getMainReport);

export default router;
