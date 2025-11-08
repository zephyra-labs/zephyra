/**
 * @file walletRoutes.ts
 * @description Wallet activity routes with full Swagger/OpenAPI 3.0 documentation
 */

import { Router } from "express";
import {
  logWalletLogin,
  logWalletDisconnect,
  getAllWalletLogs,
  getWalletLogs,
  getWalletState,
  updateWalletStateController,
  deleteWalletController
} from "../controllers/walletController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateWalletLogDTO:
 *       type: object
 *       required:
 *         - account
 *         - action
 *         - timestamp
 *       properties:
 *         account:
 *           type: string
 *           example: "0x123abc..."
 *         action:
 *           type: string
 *           enum: [connect, disconnect, switchNetwork, signMessage]
 *           example: connect
 *         timestamp:
 *           type: integer
 *           example: 1699286400000
 *         meta:
 *           type: object
 *           additionalProperties: true
 *           description: Optional metadata (IP, device info, session ID)
 *
 *     UpdateWalletStateDTO:
 *       type: object
 *       required:
 *         - account
 *       properties:
 *         account:
 *           type: string
 *           example: "0x123abc..."
 *         chainId:
 *           type: integer
 *           example: 31337
 *         provider:
 *           type: string
 *           example: "metamask"
 *         sessionId:
 *           type: string
 *           example: "session_001"
 *
 *     WalletStateResponse:
 *       type: object
 *       properties:
 *         account:
 *           type: string
 *         chainId:
 *           type: integer
 *         provider:
 *           type: string
 *         sessionId:
 *           type: string
 *         lastActiveAt:
 *           type: integer
 *           description: Unix timestamp
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Wallet data deleted"
 *
 *
 * tags:
 *   - name: Wallet
 *     description: Wallet activity endpoints
 */

/**
 * Log wallet login
 * @swagger
 * /api/wallet/log-login:
 *   post:
 *     tags: [Wallet]
 *     summary: Record a wallet login event for a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWalletLogDTO'
 *     responses:
 *       201:
 *         description: Wallet log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateWalletLogDTO'
 *       400:
 *         description: Invalid request
 */
router.post("/log-login", authMiddleware, logWalletLogin);

/**
 * Log wallet disconnect
 * @swagger
 * /api/wallet/log-disconnect:
 *   post:
 *     tags: [Wallet]
 *     summary: Record a wallet disconnect event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWalletLogDTO'
 *     responses:
 *       201:
 *         description: Wallet log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateWalletLogDTO'
 *       400:
 *         description: Invalid request
 */
router.post("/log-disconnect", authMiddleware, logWalletDisconnect);

/**
 * Get all wallet logs (admin only)
 * @swagger
 * /api/wallet/logs:
 *   get:
 *     tags: [Wallet]
 *     summary: Retrieve all wallet logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreateWalletLogDTO'
 */
router.get("/logs", authMiddleware, adminMiddleware, getAllWalletLogs);

/**
 * Get wallet logs for a specific account
 * @swagger
 * /api/wallet/{account}/logs:
 *   get:
 *     tags: [Wallet]
 *     summary: Retrieve wallet logs for a specific account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet account address
 *     responses:
 *       200:
 *         description: Wallet logs for the account
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreateWalletLogDTO'
 *       404:
 *         description: Account not found
 */
router.get("/:account/logs", authMiddleware, getWalletLogs);

/**
 * Get wallet state for a specific account
 * @swagger
 * /api/wallet/{account}/state:
 *   get:
 *     tags: [Wallet]
 *     summary: Retrieve current wallet state
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletStateResponse'
 *       404:
 *         description: State not found
 */
router.get("/:account/state", authMiddleware, getWalletState);

/**
 * Update wallet state for a specific account
 * @swagger
 * /api/wallet/{account}/state:
 *   patch:
 *     tags: [Wallet]
 *     summary: Update wallet state
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWalletStateDTO'
 *     responses:
 *       200:
 *         description: Wallet state updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Validation failed
 */
router.patch("/:account/state", authMiddleware, updateWalletStateController);

/**
 * Delete all wallet data for an account
 * @swagger
 * /api/wallet/{account}:
 *   delete:
 *     tags: [Wallet]
 *     summary: Purge wallet logs and state
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Account not found
 */
router.delete("/:account", authMiddleware, adminMiddleware, deleteWalletController);

export default router;
