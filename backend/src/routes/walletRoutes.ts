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
} from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = Router();

/**
 * @route POST /wallet/log-login
 * @description Record a wallet login event for a user.
 * @access Authenticated users
 */
router.post("/log-login", authMiddleware, logWalletLogin);

/**
 * @route POST /wallet/log-disconnect
 * @description Record a wallet disconnect event for a user.
 * @access Authenticated users
 */
router.post("/log-disconnect", authMiddleware, logWalletDisconnect);

/**
 * @route GET /wallet/logs
 * @description Retrieve all wallet logs.
 * @access Admin only
 */
router.get("/logs", authMiddleware, adminMiddleware, getAllWalletLogs);

/**
 * @route GET /wallet/:account/logs
 * @description Retrieve wallet logs for a specific account.
 * @param {string} account - Wallet address
 * @access Owner or Admin
 */
router.get("/:account/logs", authMiddleware, getWalletLogs);

/**
 * @route GET /wallet/:account/state
 * @description Retrieve current wallet state for a specific account.
 * @param {string} account - Wallet address
 * @access Owner or Admin
 */
router.get("/:account/state", authMiddleware, getWalletState);

/**
 * @route PATCH /wallet/:account/state
 * @description Update wallet state for a specific account.
 * @param {string} account - Wallet address
 * @access Owner or Admin
 */
router.patch("/:account/state", authMiddleware, updateWalletStateController);

/**
 * @route DELETE /wallet/:account
 * @description Purge all wallet data (logs + state) for a specific account.
 * @param {string} account - Wallet address
 * @access Admin only
 */
router.delete("/:account", authMiddleware, adminMiddleware, deleteWalletController);

export default router;
