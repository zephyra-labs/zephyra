/**
 * @file tradeRoutes.ts
 * @description Routes for managing trade records, participants, and status updates
 */

import { Router } from "express";
import { TradeController } from "../controllers/tradeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * --- Trade Routes ---
 * Manage trade records, participants, and status updates
 */

/**
 * Get all trade records
 * @route GET /trades
 * @group Trade
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of all trade records
 */
router.get("/", authMiddleware, TradeController.fetchAllTrades);

/**
 * Get a specific trade record by ID
 * @route GET /trades/:id
 * @group Trade
 * @security BearerAuth
 * @param {string} id.path.required - Trade ID
 * @returns {object} 200 - Trade record
 * @returns {Error} 404 - Trade not found
 */
router.get("/:id", authMiddleware, TradeController.getTradeById);

/**
 * Create a new trade record
 * @route POST /trades
 * @group Trade
 * @security BearerAuth
 * @param {object} body - Trade payload
 * @returns {object} 201 - Created trade record
 * @returns {Error} 400 - Validation error
 */
router.post("/", authMiddleware, TradeController.createTrade);

/**
 * Add a participant to an existing trade
 * @route POST /trades/:id/participant
 * @group Trade
 * @security BearerAuth
 * @param {string} id.path.required - Trade ID
 * @param {object} body - Participant info
 * @returns {object} 200 - Updated trade record
 * @returns {Error} 400 - Validation error or participant already exists
 */
router.post("/:id/participant", authMiddleware, TradeController.addParticipant);

/**
 * Assign a role to a participant in the trade
 * @route PATCH /trades/:id/role
 * @group Trade
 * @security BearerAuth
 * @param {string} id.path.required - Trade ID
 * @param {object} body - { participantAddress: string, role: string }
 * @returns {Array<object>} 200 - Updated participants
 */
router.patch("/:id/role", authMiddleware, TradeController.assignRole);

/**
 * Update the trade status
 * @route PATCH /trades/:id/status
 * @group Trade
 * @security BearerAuth
 * @param {string} id.path.required - Trade ID
 * @param {object} body - { status: string }
 * @returns {object} 200 - Updated trade record
 */
router.patch("/:id/status", authMiddleware, TradeController.updateStatus);

/**
 * Get trades related to the currently logged-in user
 * @route GET /trades/my
 * @group Trade
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of trades for the user
 */
router.get("/my", authMiddleware, TradeController.getMyTrades);

export default router;
