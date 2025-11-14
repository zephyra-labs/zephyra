/**
 * @file activityRoutes.ts
 * @description Activity log management routes with Swagger/OpenAPI 3.0 documentation
 */

import { Router } from 'express';
import {
  createActivity,
  getActivities,
  getActivityByAccountController,
} from '../controllers/activityController';
import { authMiddleware } from "../middlewares/authMiddleware";

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
 *     ActivityLog:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [onChain, backend]
 *         action:
 *           type: string
 *         account:
 *           type: string
 *         txHash:
 *           type: string
 *         contractAddress:
 *           type: string
 *         extra:
 *           type: object
 *           additionalProperties: true
 *         onChainInfo:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *             blockNumber:
 *               type: integer
 *             confirmations:
 *               type: integer
 * 
 * tags:
 *   - name: Activities
 *     description: User activity log endpoints
 */

/**
 * @swagger
 * /api/activity:
 *   post:
 *     tags: [Activities]
 *     summary: Create a new activity log
 *     description: Record a new activity entry for a user or wallet.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLog'
 *           example:
 *             account: "0x123abc..."
 *             action: "login"
 *             timestamp: 1699286400000
 *             meta:
 *               userAgent: "Mozilla/5.0"
 *               ip: "192.168.1.10"
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ActivityLog'
 *
 *       400:
 *         description: Invalid request or query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: 
 *               success: false
 *               message: "Request body is required"
 *
 *       401:
 *         description: Unauthorized access (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       422:
 *         description: Validation failed for required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAccount:
 *                 summary: Missing account field
 *                 value:
 *                   success: false
 *                   message: "Missing required field: account"
 *               invalidTimestamp:
 *                 summary: Invalid timestamp field
 *                 value:
 *                   success: false
 *                   message: "timestamp must be a number"
 *
 *       500:
 *         description: Server error while creating activity log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create activity"
 */
router.post('/', authMiddleware, createActivity);

/**
 * @swagger
 * /api/activity:
 *   get:
 *     tags: [Activities]
 *     summary: Get all activity logs
 *     description: Retrieve a list of activity logs with optional filtering and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: Filter logs by wallet account address.
 *         example: "0x123abc..."
 *       - in: query
 *         name: txHash
 *         schema:
 *           type: string
 *         description: Filter logs by on-chain transaction hash.
 *         example: "0xabc123..."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of records to return.
 *         example: 20
 *       - in: query
 *         name: startAfterTimestamp
 *         schema:
 *           type: integer
 *         description: Pagination cursor — start listing after this Unix timestamp (ms).
 *         example: 1699286400000
 *     responses:
 *       200:
 *         description: List of filtered activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of logs returned
 *                       example: 3
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActivityLog'
 *             examples:
 *               default:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     count: 2
 *                     items:
 *                       - account: "0x123abc..."
 *                         action: "login"
 *                         timestamp: 1699286400000
 *                         meta:
 *                           userAgent: "Mozilla/5.0"
 *                       - account: "0x456def..."
 *                         action: "logout"
 *                         timestamp: 1699290000000
 *                         meta:
 *                           ip: "192.168.1.10"
 *
 *       400:
 *         description: Invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidLimit:
 *                 summary: Limit is not a number
 *                 value:
 *                   success: false
 *                   message: "limit must be a number"
 *               invalidStartAfter:
 *                 summary: startAfterTimestamp is not a number
 *                 value:
 *                   success: false
 *                   message: "startAfterTimestamp must be a number"
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
 *       500:
 *         description: Server error while retrieving logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch activities"
 */
router.get('/', authMiddleware, getActivities);

/**
 * @swagger
 * /api/activity/{account}:
 *   get:
 *     tags: [Activities]
 *     summary: Get activities by account address
 *     description: Retrieve all activity logs associated with a specific wallet address, with optional pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to filter activities by
 *         example: "0x123abc..."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of logs to return
 *         example: 20
 *       - in: query
 *         name: startAfterTimestamp
 *         schema:
 *           type: integer
 *         description: Pagination cursor — start listing after this Unix timestamp (ms)
 *         example: 1699286400000
 *     responses:
 *       200:
 *         description: Activity logs for the specified account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: string
 *                       example: "0x123abc..."
 *                     count:
 *                       type: integer
 *                       example: 2
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActivityLog'
 *       400:
 *         description: Invalid path or query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAccount:
 *                 summary: Account missing
 *                 value:
 *                   success: false
 *                   message: "Account parameter is required"
 *               invalidLimit:
 *                 summary: Limit not a number
 *                 value:
 *                   success: false
 *                   message: "limit must be a number"
 *               invalidStartAfter:
 *                 summary: startAfterTimestamp not a number
 *                 value:
 *                   success: false
 *                   message: "startAfterTimestamp must be a number"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       404:
 *         description: Account not found or no logs exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account not found or no logs exist"
 *       500:
 *         description: Server error while retrieving activities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch activities for this account"
 */
router.get('/:account', authMiddleware, getActivityByAccountController);

export default router;
