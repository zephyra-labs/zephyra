/**
 * @file contractRoutes.ts
 * @description Routes for managing deployed contracts, contract logs, and on-chain progress with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import { ContractController } from "../controllers/contractController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ContractLogExtra:
 *       type: object
 *       additionalProperties: true
 *       description: Optional extra metadata
 *
 *     ContractLogEntry:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         txHash:
 *           type: string
 *         account:
 *           type: string
 *         exporter:
 *           type: string
 *         importer:
 *           type: string
 *         logistics:
 *           type: array
 *           items:
 *             type: string
 *         insurance:
 *           type: string
 *         inspector:
 *           type: string
 *         requiredAmount:
 *           type: string
 *         extra:
 *           $ref: '#/components/schemas/ContractLogExtra'
 *         timestamp:
 *           type: integer
 *         onChainInfo:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *             blockNumber:
 *               type: integer
 *             confirmations:
 *               type: integer
 *
 *     ContractState:
 *       type: object
 *       properties:
 *         exporter:
 *           type: string
 *         importer:
 *           type: string
 *         logistics:
 *           type: array
 *           items:
 *             type: string
 *         insurance:
 *           type: string
 *         inspector:
 *           type: string
 *         status:
 *           type: string
 *         currentStage:
 *           type: string
 *         lastUpdated:
 *           type: integer
 *
 *     ContractLogs:
 *       type: object
 *       properties:
 *         contractAddress:
 *           type: string
 *         state:
 *           $ref: '#/components/schemas/ContractState'
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContractLogEntry'
 *
 * tags:
 *   - name: Contracts
 *     description: Smart contract management and logs
 */

/**
 * @swagger
 * /api/contract/my:
 *   get:
 *     tags: [Contracts]
 *     summary: Get all contracts owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user-owned contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContractLogs'
 */
router.get("/my", authMiddleware, ContractController.getUserContracts);

/**
 * @swagger
 * /api/contract/{address}/details:
 *   get:
 *     tags: [Contracts]
 *     summary: Get detailed information about a specific contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractLogs'
 */
router.get("/:address/details", authMiddleware, ContractController.getContractDetails);

/**
 * @swagger
 * /api/contract/{address}/step:
 *   get:
 *     tags: [Contracts]
 *     summary: Get current lifecycle step/status of a specific contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract current step/status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractState'
 */
router.get("/:address/step", authMiddleware, ContractController.getContractStep);

/**
 * @swagger
 * /api/contract:
 *   get:
 *     tags: [Contracts]
 *     summary: Get all deployed contracts in the system
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all deployed contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContractLogs'
 */
router.get("/", authMiddleware, ContractController.fetchDeployedContracts);

/**
 * @swagger
 * /api/contract/log:
 *   post:
 *     tags: [Contracts]
 *     summary: Add a new contract log and update its state
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractLogEntry'
 *     responses:
 *       201:
 *         description: Newly created contract log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractLogEntry'
 */
router.post("/log", authMiddleware, ContractController.logContractAction);

export default router;
