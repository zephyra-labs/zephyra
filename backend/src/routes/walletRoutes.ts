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
 *             example:
 *               account: "0x123abc..."
 *               action: "connect"
 *               timestamp: 1699286400000
 *               meta:
 *                 ip: "192.168.1.1"
 *                 device: "Chrome on Windows"
 *
 *       400:
 *         description: Invalid request — Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account parameter is required"
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
 *         description: Server error while logging wallet activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to log wallet login"
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
 *             example:
 *               account: "0x123abc..."
 *               action: "disconnect"
 *               timestamp: 1699286400000
 *               meta:
 *                 ip: "192.168.1.1"
 *                 device: "Chrome on Windows"
 *
 *       400:
 *         description: Invalid request — Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account parameter is required"
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
 *         description: Server error while logging wallet disconnect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to log wallet disconnect"
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
 *             example:
 *               - account: "0x123abc..."
 *                 action: "connect"
 *                 timestamp: 1699286400000
 *                 meta:
 *                   ip: "192.168.1.1"
 *                   device: "Chrome on Windows"
 *               - account: "0x456def..."
 *                 action: "disconnect"
 *                 timestamp: 1699372800000
 *                 meta:
 *                   ip: "192.168.1.2"
 *                   device: "MetaMask Mobile"
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
 *         description: Server error while fetching wallet logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch wallet logs"
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
 *             example:
 *               - account: "0x123abc..."
 *                 action: "connect"
 *                 timestamp: 1699286400000
 *                 meta:
 *                   ip: "192.168.1.1"
 *                   device: "Chrome on Windows"
 *               - account: "0x123abc..."
 *                 action: "disconnect"
 *                 timestamp: 1699372800000
 *                 meta:
 *                   ip: "192.168.1.1"
 *                   device: "Chrome on Windows"
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
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Wallet logs not found"
 *
 *       500:
 *         description: Server error while fetching wallet logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch wallet logs for account"
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
 *         description: Wallet account address
 *     responses:
 *       200:
 *         description: Wallet state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletStateResponse'
 *             example:
 *               account: "0x123abc..."
 *               chainId: 31337
 *               provider: "metamask"
 *               sessionId: "session_001"
 *               lastActiveAt: 1699372800000
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
 *         description: Wallet state not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Wallet state not found"
 *
 *       500:
 *         description: Server error while fetching wallet state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch wallet state"
 */
router.get("/:account/state", authMiddleware, getWalletState);

/**
 * @swagger
 * /api/wallet/{account}/state:
 *   patch:
 *     tags: [Wallet]
 *     summary: Update wallet state
 *     description: Update the state of a wallet for a specific account. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet account address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWalletStateDTO'
 *           example:
 *             account: "0x123abc..."
 *             chainId: 31337
 *             provider: "metamask"
 *             sessionId: "session_001"
 *     responses:
 *       200:
 *         description: Wallet state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wallet state updated"
 *             examples:
 *               success:
 *                 summary: Wallet state updated
 *                 value:
 *                   message: "Wallet state updated"
 *
 *       400:
 *         description: Validation failed or missing account parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account parameter is required"
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
 *         description: Wallet state not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Wallet state not found"
 *
 *       500:
 *         description: Server error while updating wallet state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update wallet state"
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
 *         description: Wallet account address
 *     responses:
 *       200:
 *         description: Wallet data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Wallet data deleted"
 * 
 *       400:
 *         description: Validation failed or missing account parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account parameter is required"
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
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account not found"
 *
 *       500:
 *         description: Server error while deleting wallet data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete wallet data"
 */
router.delete("/:account", authMiddleware, adminMiddleware, deleteWalletController);

export default router;
