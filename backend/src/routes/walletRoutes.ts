/**
 * @file walletRoutes.ts
 * @description Wallet activity routes: login, disconnect, fetch logs, manage wallet state, and purge wallet data.
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
 * Record a wallet login event for a user
 * @route POST /wallet/log-login
 * @group Wallet
 * @security BearerAuth
 * @returns {object} 200 - Wallet log created
 * @returns {Error} 400 - Invalid request
 */
router.post("/log-login", authMiddleware, logWalletLogin);

/**
 * Record a wallet disconnect event for a user
 * @route POST /wallet/log-disconnect
 * @group Wallet
 * @security BearerAuth
 * @returns {object} 200 - Wallet log created
 * @returns {Error} 400 - Invalid request
 */
router.post("/log-disconnect", authMiddleware, logWalletDisconnect);

/**
 * Retrieve all wallet logs
 * @route GET /wallet/logs
 * @group Wallet
 * @security BearerAuth
 * @access Admin only
 * @returns {Array<object>} 200 - List of wallet logs
 */
router.get("/logs", authMiddleware, adminMiddleware, getAllWalletLogs);

/**
 * Retrieve wallet logs for a specific account
 * @route GET /wallet/:account/logs
 * @group Wallet
 * @security BearerAuth
 * @param {string} account.path.required - Wallet address
 * @returns {Array<object>} 200 - Wallet logs for the account
 * @returns {Error} 404 - Account not found
 */
router.get("/:account/logs", authMiddleware, getWalletLogs);

/**
 * Retrieve current wallet state for a specific account
 * @route GET /wallet/:account/state
 * @group Wallet
 * @security BearerAuth
 * @param {string} account.path.required - Wallet address
 * @returns {object} 200 - Wallet state
 * @returns {Error} 404 - State not found
 */
router.get("/:account/state", authMiddleware, getWalletState);

/**
 * Update wallet state for a specific account
 * @route PATCH /wallet/:account/state
 * @group Wallet
 * @security BearerAuth
 * @param {string} account.path.required - Wallet address
 * @param {object} body - Partial wallet state update
 * @returns {object} 200 - Updated wallet state
 * @returns {Error} 400 - Validation failed
 */
router.patch("/:account/state", authMiddleware, updateWalletStateController);

/**
 * Purge all wallet data (logs + state) for a specific account
 * @route DELETE /wallet/:account
 * @group Wallet
 * @security BearerAuth
 * @access Admin only
 * @param {string} account.path.required - Wallet address
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - Account not found
 */
router.delete("/:account", authMiddleware, adminMiddleware, deleteWalletController);

export default router;
