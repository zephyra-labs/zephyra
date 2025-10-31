import { Router } from "express"
import { ContractController } from "../controllers/contractController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

/**
 * --- Contract Routes ---
 * Manage deployed trade contracts, their logs, and on-chain progress.
 * Includes endpoints for user-specific and general contract queries.
 */

/**
 * GET /contracts/my
 * Retrieve all contracts owned by the authenticated user.
 */
router.get("/my", authMiddleware, ContractController.getUserContracts)

/**
 * GET /contracts/:address/details
 * Retrieve detailed information about a specific contract.
 */
router.get("/:address/details", authMiddleware, ContractController.getContractDetails)

/**
 * GET /contracts/:address/step
 * Retrieve current lifecycle step/status of the specified contract.
 */
router.get("/:address/step", authMiddleware, ContractController.getContractStep)

/**
 * GET /contracts
 * Retrieve all deployed contracts available in the system.
 */
router.get("/", authMiddleware, ContractController.fetchDeployedContracts)

/**
 * POST /contracts/log
 * Add a new contract log and update its state.
 */
router.post("/log", authMiddleware, ContractController.logContractAction)

export default router
