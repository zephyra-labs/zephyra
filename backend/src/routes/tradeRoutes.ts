/**
 * @file tradeRoutes.ts
 * @description Express router for trade-related endpoints with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import { TradeController } from "../controllers/tradeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TradeParticipantDTO:
 *       type: object
 *       required:
 *         - address
 *         - kycVerified
 *         - walletConnected
 *       properties:
 *         address:
 *           type: string
 *           example: "0xabc123..."
 *         role:
 *           type: string
 *           enum: ["exporter", "importer", "logistics", "insurance", "inspector"]
 *           example: "exporter"
 *         kycVerified:
 *           type: boolean
 *           example: false
 *         walletConnected:
 *           type: boolean
 *           example: true
 *
 *     TradeDTO:
 *       type: object
 *       required:
 *         - id
 *         - participants
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           example: "trade-uuid-123"
 *         contractAddress:
 *           type: string
 *           example: "0xcontract..."
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TradeParticipantDTO'
 *         status:
 *           type: string
 *           enum: ["draft", "readyToTrade", "inProgress", "completed", "cancelled"]
 *           example: "draft"
 *         currentStage:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *
 * tags:
 *   - name: Trade
 *     description: Trade management endpoints
 */

/**
 * Get all trades
 * @swagger
 * /api/trade:
 *   get:
 *     tags: [Trade]
 *     summary: Get all trade records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TradeDTO'
 */
router.get("/", authMiddleware, TradeController.fetchAllTrades);

/**
 * Get trade by ID
 * @swagger
 * /api/trade/{id}:
 *   get:
 *     tags: [Trade]
 *     summary: Get a specific trade by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Trade ID
 *     responses:
 *       200:
 *         description: Trade record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TradeDTO'
 *       404:
 *         description: Trade not found
 */
router.get("/:id", authMiddleware, TradeController.getTradeById);

/**
 * Create new trade
 * @swagger
 * /api/trade:
 *   post:
 *     tags: [Trade]
 *     summary: Create a new trade
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TradeDTO'
 *     responses:
 *       201:
 *         description: Created trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TradeDTO'
 *       400:
 *         description: Validation error
 */
router.post("/", authMiddleware, TradeController.createTrade);

/**
 * Add participant
 * @swagger
 * /api/trade/{id}/participant:
 *   post:
 *     tags: [Trade]
 *     summary: Add participant to trade
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Trade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TradeParticipantDTO'
 *     responses:
 *       200:
 *         description: Updated trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TradeDTO'
 *       400:
 *         description: Validation error
 */
router.post("/:id/participant", authMiddleware, TradeController.addParticipant);

/**
 * Assign role to participant
 * @swagger
 * /api/trade/{id}/role:
 *   patch:
 *     tags: [Trade]
 *     summary: Assign role to participant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Trade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantAddress:
 *                 type: string
 *                 example: "0xabc123..."
 *               role:
 *                 type: string
 *                 example: "buyer"
 *     responses:
 *       200:
 *         description: Updated participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TradeParticipantDTO'
 */
router.patch("/:id/role", authMiddleware, TradeController.assignRole);

/**
 * Update trade status
 * @swagger
 * /api/trade/{id}/status:
 *   patch:
 *     tags: [Trade]
 *     summary: Update trade status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Trade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Updated trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TradeDTO'
 */
router.patch("/:id/status", authMiddleware, TradeController.updateStatus);

/**
 * Get trades of current user
 * @swagger
 * /api/trade/my:
 *   get:
 *     tags: [Trade]
 *     summary: Get trades for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's trades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TradeDTO'
 */
router.get("/my", authMiddleware, TradeController.getMyTrades);

export default router;
