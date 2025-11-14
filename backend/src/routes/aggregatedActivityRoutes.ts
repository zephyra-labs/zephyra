/**
 * @file aggregatedActivityRoutes.ts
 * @description Aggregated activity management routes with Swagger/OpenAPI 3.0 documentation
 */

import { Router } from 'express';
import {
  addAggregatedActivity,
  getAggregatedActivityById,
  getAggregatedActivities,
  addAggregatedTag,
  removeAggregatedTag,
} from '../controllers/aggregatedActivityController';
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
 *     AggregatedActivityLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
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
 *         tags:
 *           type: array
 *           items:
 *             type: string
 * tags:
 *   - name: AggregatedActivities
 *     description: Aggregated activity endpoints
 */

/**
 * @swagger
 * /api/aggregated:
 *   post:
 *     tags: [AggregatedActivities]
 *     summary: Create a new aggregated activity
 *     description: Store a new aggregated activity log combining on-chain and backend events.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AggregatedActivityLog'
 *           example:
 *             id: "agg-123"
 *             timestamp: 1699286400000
 *             type: "backend"
 *             action: "user_register"
 *             account: "0x123abc..."
 *             extra:
 *               ip: "192.168.1.20"
 *               userAgent: "Mozilla/5.0"
 *             tags: ["user", "signup"]
 *     responses:
 *       201:
 *         description: Aggregated activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AggregatedActivityLog'
 *
 *       400:
 *         description: Missing required field or invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing required field: account"
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
 *       422:
 *         description: Validation failed (e.g., invalid data type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Action must be a string"
 *
 *       500:
 *         description: Server error while creating aggregated activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create aggregated activity"
 */
router.post('/', authMiddleware, addAggregatedActivity);

/**
 * @swagger
 * /api/aggregated/{id}:
 *   get:
 *     tags: [AggregatedActivities]
 *     summary: Get a single aggregated activity by ID
 *     description: Retrieve details of a specific aggregated activity.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *         example: "agg-123"
 *     responses:
 *       200:
 *         description: Aggregated activity details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AggregatedActivityLog'
 *
 *       400:
 *         description: Missing or invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing ID parameter"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Aggregated activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Aggregated activity log not found"
 *
 *       500:
 *         description: Server error while fetching aggregated activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch aggregated activity"
 */
router.get('/:id', authMiddleware, adminMiddleware, getAggregatedActivityById);

/**
 * @swagger
 * /api/aggregated:
 *   get:
 *     tags: [AggregatedActivities]
 *     summary: Get all aggregated activities
 *     description: Retrieve a list of aggregated activities with optional filtering and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: Filter by wallet account
 *         example: "0x123abc..."
 *       - in: query
 *         name: txHash
 *         schema:
 *           type: string
 *         description: Filter by transaction hash
 *         example: "0xabc123..."
 *       - in: query
 *         name: contractAddress
 *         schema:
 *           type: string
 *         description: Filter by contract address
 *         example: "0xcontract..."
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *         example: "user,signup"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of items to return
 *         example: 20
 *       - in: query
 *         name: startAfterTimestamp
 *         schema:
 *           type: integer
 *         description: Pagination cursor (start after this timestamp in ms)
 *         example: 1699286400000
 *     responses:
 *       200:
 *         description: List of aggregated activities
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
 *                       example: 2
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AggregatedActivityLog'
 *                     nextStartAfterTimestamp:
 *                       type: integer
 *                       nullable: true
 *                       description: Timestamp for next pagination batch
 *                       example: 1699287400000
 *
 *       400:
 *         description: Invalid query parameters (limit/startAfterTimestamp not a number)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "limit must be a number"
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
 *         description: Server error while fetching aggregated activities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch aggregated activities"
 */
router.get('/', authMiddleware, adminMiddleware, getAggregatedActivities);

/**
 * @swagger
 * /api/aggregated/{id}/tag:
 *   post:
 *     tags: [AggregatedActivities]
 *     summary: Add a tag to an aggregated activity
 *     description: Attach a new tag to an existing aggregated activity log.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *         example: "agg-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tag:
 *                 type: string
 *                 example: "important"
 *     responses:
 *       200:
 *         description: Tag added successfully
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
 *                     tag:
 *                       type: string
 *                       example: "important"
 *                     message:
 *                       type: string
 *                       example: "Tag added successfully"
 *
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidTag:
 *                 summary: Tag field missing or invalid
 *                 value:
 *                   success: false
 *                   message: "Tag is required and must be a string"
 *               missingId:
 *                 summary: ID parameter missing
 *                 value:
 *                   success: false
 *                   message: "Missing ID parameter"
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
 *         description: Aggregated activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Aggregated activity log not found"
 *
 *       500:
 *         description: Server error while adding tag
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to add tag to aggregated activity"
 */
router.post('/:id/tag', authMiddleware, adminMiddleware, addAggregatedTag);

/**
 * @swagger
 * /api/aggregated/{id}/tag:
 *   delete:
 *     tags: [AggregatedActivities]
 *     summary: Remove a tag from an aggregated activity
 *     description: Remove an existing tag from an aggregated activity log.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *         example: "agg-123"
 *       - in: query
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *           example: "important"
 *         description: Tag to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully
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
 *                     tag:
 *                       type: string
 *                       example: "important"
 *                     message:
 *                       type: string
 *                       example: "Tag removed successfully"
 *
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingTag:
 *                 summary: Tag query parameter missing or invalid
 *                 value:
 *                   success: false
 *                   message: "Tag is required and must be a string"
 *               missingId:
 *                 summary: ID parameter missing
 *                 value:
 *                   success: false
 *                   message: "Missing ID parameter"
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
 *         description: Aggregated activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Aggregated activity log not found"
 *
 *       500:
 *         description: Server error while removing tag
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to remove tag from aggregated activity"
 */
router.delete('/:id/tag', authMiddleware, adminMiddleware, removeAggregatedTag);

export default router;
