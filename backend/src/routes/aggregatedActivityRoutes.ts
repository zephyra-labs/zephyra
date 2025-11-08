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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AggregatedActivityLog'
 *     responses:
 *       201:
 *         description: Aggregated activity created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AggregatedActivityLog'
 */
router.post('/', authMiddleware, addAggregatedActivity);

/**
 * @swagger
 * /api/aggregated/{id}:
 *   get:
 *     tags: [AggregatedActivities]
 *     summary: Get a single aggregated activity by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *     responses:
 *       200:
 *         description: Aggregated activity details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AggregatedActivityLog'
 */
router.get('/:id', authMiddleware, adminMiddleware, getAggregatedActivityById);

/**
 * @swagger
 * /api/aggregated:
 *   get:
 *     tags: [AggregatedActivities]
 *     summary: Get all aggregated activities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of aggregated activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AggregatedActivityLog'
 */
router.get('/', authMiddleware, adminMiddleware, getAggregatedActivities);

/**
 * @swagger
 * /api/aggregated/{id}/tag:
 *   post:
 *     tags: [AggregatedActivities]
 *     summary: Add a tag to an aggregated activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tag added successfully"
 */
router.post('/:id/tag', authMiddleware, adminMiddleware, addAggregatedTag);

/**
 * @swagger
 * /api/aggregated/{id}/tag:
 *   delete:
 *     tags: [AggregatedActivities]
 *     summary: Remove a tag from an aggregated activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregated activity ID
 *       - in: query
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tag removed successfully"
 */
router.delete('/:id/tag', authMiddleware, adminMiddleware, removeAggregatedTag);

export default router;
