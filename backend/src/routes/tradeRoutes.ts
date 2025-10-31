import { Router } from "express"
import { TradeController } from "../controllers/tradeController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router();

/**
 * --- Trade Routes ---
 * Manage trade records, participants, and status updates
 */

/**
 * GET /trades
 * Get all trade records (admin or authenticated users)
 */
router.get("/", authMiddleware, TradeController.fetchAllTrades);

/**
 * GET /trades/:id
 * Get a specific trade record by its ID
 */
router.get("/:id", authMiddleware, TradeController.getTradeById);

/**
 * POST /trades
 * Create a new trade record
 */
router.post("/", authMiddleware, TradeController.createTrade);

/**
 * POST /trades/:id/participant
 * Add a participant to an existing trade
 */
router.post("/:id/participant", authMiddleware, TradeController.addParticipant);

/**
 * PATCH /trades/:id/role
 * Assign a role (exporter, importer, etc.) to a participant in the trade
 */
router.patch("/:id/role", authMiddleware, TradeController.assignRole);

/**
 * PATCH /trades/:id/status
 * Update the trade status (draft, inProgress, completed, etc.)
 */
router.patch("/:id/status", authMiddleware, TradeController.updateStatus);

/**
 * GET /trades/my
 * Get trades related to the currently logged-in user
 */
router.get("/my", authMiddleware, TradeController.getMyTrades);

export default router;
