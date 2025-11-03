/**
 * @file contractRoutes.ts
 * @description Routes for managing deployed contracts, contract logs, and on-chain progress.
 */

import { Router } from "express";
import { ContractController } from "../controllers/contractController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * Get all contracts owned by the authenticated user
 * @route GET /contracts/my
 * @group Contracts
 * @security BearerAuth
 * @returns {object} 200 - List of contracts for the current user
 */
router.get("/my", authMiddleware, ContractController.getUserContracts);

/**
 * Get detailed information about a specific contract
 * @route GET /contracts/{address}/details
 * @group Contracts
 * @param {string} address.path.required - Contract address
 * @security BearerAuth
 * @returns {object} 200 - Contract details
 */
router.get("/:address/details", authMiddleware, ContractController.getContractDetails);

/**
 * Get current lifecycle step/status of a specific contract
 * @route GET /contracts/{address}/step
 * @group Contracts
 * @param {string} address.path.required - Contract address
 * @security BearerAuth
 * @returns {object} 200 - Contract step/status
 */
router.get("/:address/step", authMiddleware, ContractController.getContractStep);

/**
 * Get all deployed contracts in the system
 * @route GET /contracts
 * @group Contracts
 * @security BearerAuth
 * @returns {object} 200 - List of all deployed contracts
 */
router.get("/", authMiddleware, ContractController.fetchDeployedContracts);

/**
 * Add a new contract log and update its state
 * @route POST /contracts/log
 * @group Contracts
 * @param {object} body.body.required - Contract log data
 * @security BearerAuth
 * @returns {object} 201 - Newly created contract log
 */
router.post("/log", authMiddleware, ContractController.logContractAction);

export default router;
