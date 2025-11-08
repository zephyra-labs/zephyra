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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLog'
 *     responses:
 *       201:
 *         description: Activity log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivityLog'
 */
router.post('/', authMiddleware, createActivity);

/**
 * @swagger
 * /api/activity:
 *   get:
 *     tags: [Activities]
 *     summary: Get all activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: Filter by account address
 *       - in: query
 *         name: txHash
 *         schema:
 *           type: string
 *         description: Filter by transaction hash
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Pagination limit
 *       - in: query
 *         name: startAfterTimestamp
 *         schema:
 *           type: integer
 *         description: Pagination starting timestamp
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActivityLog'
 */
router.get('/', authMiddleware, getActivities);

/**
 * @swagger
 * /api/activity/{account}:
 *   get:
 *     tags: [Activities]
 *     summary: Get activities by account address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Pagination limit
 *       - in: query
 *         name: startAfterTimestamp
 *         schema:
 *           type: integer
 *         description: Pagination starting timestamp
 *     responses:
 *       200:
 *         description: List of activity logs for the account
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActivityLog'
 */
router.get('/:account', authMiddleware, getActivityByAccountController);

export default router;
