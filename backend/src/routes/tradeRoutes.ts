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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TradeDTO'
 *             example:
 *               success: true
 *               data:
 *                 id: "trade-uuid-123"
 *                 contractAddress: "0xabc123..."
 *                 participants:
 *                   - address: "0x111..."
 *                     role: "exporter"
 *                     kycVerified: true
 *                     walletConnected: true
 *                 status: "draft"
 *                 currentStage: 1
 *                 createdAt: 1699286400000
 *                 updatedAt: 1699372800000
 *
 *       401:
 *         description: Unauthorized — Invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Trade not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Trade not found"
 *
 *       500:
 *         description: Server error — Failed to fetch trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch trade"
 */
router.get("/", authMiddleware, TradeController.fetchAllTrades);

/**
 * @swagger
 * /api/trade/{id}:
 *   get:
 *     tags: [Trade]
 *     summary: Get a specific trade by ID
 *     description: Retrieve a trade record by its unique ID. Requires authentication.
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
 *         description: Trade record fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TradeDTO'
 *             examples:
 *               example1:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "trade-uuid-123"
 *                     contractAddress: "0xabc123..."
 *                     participants:
 *                       - address: "0x111..."
 *                         role: "exporter"
 *                         kycVerified: true
 *                         walletConnected: true
 *                     status: "draft"
 *                     currentStage: 1
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *
 *       401:
 *         description: Unauthorized — Invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized access
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Trade not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notfound:
 *                 summary: Trade not found
 *                 value:
 *                   success: false
 *                   message: "Trade not found"
 *
 *       422:
 *         description: Missing trade ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingparam:
 *                 summary: Missing trade ID
 *                 value:
 *                   success: false
 *                   message: "Missing id parameter"
 *
 *       500:
 *         description: Server error — Failed to fetch trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               servererror:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to fetch trade"
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
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "0x111..."
 *                     role:
 *                       type: string
 *                       example: "exporter"
 *                     kycVerified:
 *                       type: boolean
 *                       example: false
 *                     walletConnected:
 *                       type: boolean
 *                       example: false
 *           example:
 *             participants:
 *               - address: "0x111..."
 *                 role: "exporter"
 *                 kycVerified: true
 *                 walletConnected: true
 *               - address: "0x222..."
 *                 role: "importer"
 *                 kycVerified: false
 *                 walletConnected: false
 *
 *     responses:
 *       201:
 *         description: Trade created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TradeDTO'
 *             example:
 *               success: true
 *               data:
 *                 id: "trade-uuid-789"
 *                 contractAddress: null
 *                 participants:
 *                   - address: "0x111..."
 *                     role: "exporter"
 *                     kycVerified: true
 *                     walletConnected: true
 *                 status: "draft"
 *                 currentStage: 1
 *                 createdAt: 1699286400000
 *                 updatedAt: 1699286400000
 *
 *       400:
 *         description: Validation error (e.g., missing participants)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Participants are required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error — Failed to create trade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create trade"
 */
router.post("/", authMiddleware, TradeController.createTrade);

/**
 * @swagger
 * /api/trade/{id}/participant:
 *   post:
 *     tags: [Trade]
 *     summary: Add a participant to an existing trade
 *     description: Add a new participant to a trade by trade ID. Returns the updated trade.
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
 *           example:
 *             address: "0x111..."
 *             role: "importer"
 *             kycVerified: false
 *             walletConnected: false
 *     responses:
 *       200:
 *         description: Participant added successfully, returning updated trade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TradeDTO'
 *             examples:
 *               successExample:
 *                 summary: Updated trade
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "trade-uuid-123"
 *                     contractAddress: "0xabc123..."
 *                     participants:
 *                       - address: "0x999..."
 *                         role: "exporter"
 *                         kycVerified: true
 *                         walletConnected: true
 *                       - address: "0x111..."
 *                         role: "importer"
 *                         kycVerified: false
 *                         walletConnected: false
 *                     status: "draft"
 *                     currentStage: 1
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *
 *       400:
 *         description: Validation error — Missing participant data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingData:
 *                 summary: Participant data missing
 *                 value:
 *                   success: false
 *                   message: "Participant data is required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized access
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Trade not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Trade not found
 *                 value:
 *                   success: false
 *                   message: "Trade not found"
 *
 *       422:
 *         description: Missing trade ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Trade ID missing
 *                 value:
 *                   success: false
 *                   message: "Missing trade id parameter"
 *
 *       500:
 *         description: Server error — Failed to add participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to add participant"
 */
router.post("/:id/participant", authMiddleware, TradeController.addParticipant);

/**
 * @swagger
 * /api/trade/{id}/role:
 *   patch:
 *     tags: [Trade]
 *     summary: Assign a role to a trade participant
 *     description: Update the role of a participant in a trade by trade ID.
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
 *             required:
 *               - address
 *               - role
 *             properties:
 *               address:
 *                 type: string
 *                 description: Wallet address of the participant
 *                 example: "0xabc123..."
 *               role:
 *                 type: string
 *                 description: Role to assign to the participant
 *                 enum: ["exporter", "importer", "logistics", "insurance", "inspector"]
 *                 example: "importer"
 *           example:
 *             address: "0xabc123..."
 *             role: "importer"
 *     responses:
 *       200:
 *         description: Successfully updated participant role
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
 *                     $ref: '#/components/schemas/TradeParticipantDTO'
 *             examples:
 *               updatedRoles:
 *                 summary: Updated participant roles
 *                 value:
 *                   success: true
 *                   data:
 *                     - address: "0x111..."
 *                       role: "exporter"
 *                       kycVerified: true
 *                       walletConnected: true
 *                     - address: "0xabc123..."
 *                       role: "importer"
 *                       kycVerified: false
 *                       walletConnected: true
 *
 *       400:
 *         description: Validation error — missing address or role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing participant address or role
 *                 value:
 *                   success: false
 *                   message: "Participant address and role are required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized access
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Trade not found or participant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Trade or participant not found
 *                 value:
 *                   success: false
 *                   message: "Trade not found"
 *
 *       422:
 *         description: Missing trade ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Trade ID missing
 *                 value:
 *                   success: false
 *                   message: "Missing trade id parameter"
 *
 *       500:
 *         description: Server error — Failed to assign role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to assign role"
 */
router.patch("/:id/role", authMiddleware, TradeController.assignRole);

/**
 * @swagger
 * /api/trade/{id}/status:
 *   patch:
 *     tags: [Trade]
 *     summary: Update trade status
 *     description: Update the status of a trade by its ID.
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the trade
 *                 enum: ["draft", "readyToTrade", "inProgress", "completed", "cancelled"]
 *                 example: "completed"
 *           example:
 *             status: "completed"
 *     responses:
 *       200:
 *         description: Trade status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TradeDTO'
 *             examples:
 *               success:
 *                 summary: Updated trade
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "trade-uuid-123"
 *                     status: "completed"
 *                     contractAddress: "0xabc123..."
 *                     participants:
 *                       - address: "0x111..."
 *                         role: "exporter"
 *                         kycVerified: true
 *                         walletConnected: true
 *                     currentStage: 3
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *
 *       400:
 *         description: Validation error — status missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingStatus:
 *                 summary: Status missing
 *                 value:
 *                   success: false
 *                   message: "Status is required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized access
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Trade not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Trade not found
 *                 value:
 *                   success: false
 *                   message: "Trade not found"
 *
 *       422:
 *         description: Missing trade ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Trade ID missing
 *                 value:
 *                   success: false
 *                   message: "Missing trade id parameter"
 *
 *       500:
 *         description: Server error — Failed to update trade status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to update trade status"
 */
router.patch("/:id/status", authMiddleware, TradeController.updateStatus);

/**
 * @swagger
 * /api/trade/my:
 *   get:
 *     tags: [Trade]
 *     summary: Get trades for the current authenticated user
 *     description: Retrieve all trades that the authenticated user participates in.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's trades fetched successfully
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
 *                     $ref: '#/components/schemas/TradeDTO'
 *             examples:
 *               successExample:
 *                 summary: Example user trades
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "trade-uuid-111"
 *                       contractAddress: "0xcontract1..."
 *                       participants:
 *                         - address: "0xUserAddress..."
 *                           role: "exporter"
 *                           kycVerified: true
 *                           walletConnected: true
 *                       status: "inProgress"
 *                       currentStage: 2
 *                       createdAt: 1699286400000
 *                       updatedAt: 1699372800000
 *                     - id: "trade-uuid-222"
 *                       contractAddress: "0xcontract2..."
 *                       participants:
 *                         - address: "0xUserAddress..."
 *                           role: "importer"
 *                           kycVerified: true
 *                           walletConnected: true
 *                       status: "draft"
 *                       currentStage: 1
 *                       createdAt: 1699200000000
 *                       updatedAt: 1699203600000
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: No trades found for the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noTrades:
 *                 summary: User has no trades
 *                 value:
 *                   success: false
 *                   message: "No trades found for user"
 *
 *       500:
 *         description: Server error — Failed to fetch user trades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to fetch user trades"
 */
router.get("/my", authMiddleware, TradeController.getMyTrades);

export default router;
