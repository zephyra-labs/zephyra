import { Router } from "express"
import { TradeController } from "../controllers/tradeController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

// --- Get all trades ---
router.get("/", authMiddleware, TradeController.fetchAllTrades)

// --- Get trade by ID ---
router.get("/:id", authMiddleware, TradeController.getTradeById)

// --- Create trade ---
router.post("/", authMiddleware, TradeController.createTrade)

// --- Add participant to trade ---
router.post("/:id/participant", authMiddleware, TradeController.addParticipant)

// --- Assign role to participant ---
router.patch("/:id/role", authMiddleware, TradeController.assignRole)

// --- Update trade status ---
router.patch("/:id/status", authMiddleware, TradeController.updateStatus)

// --- Get trades for current user ---
router.get("/my", authMiddleware, TradeController.getMyTrades)

export default router
