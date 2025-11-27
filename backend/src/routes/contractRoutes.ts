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
 *     description: Retrieve all smart contracts associated with the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user-owned contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContractLogs'
 *             examples:
 *               success:
 *                 summary: Example user contracts
 *                 value:
 *                   success: true
 *                   data:
 *                     - contractAddress: "0xContractAddress1"
 *                       state:
 *                         exporter: "0xExporter1"
 *                         importer: "0xImporter1"
 *                         logistics: ["0xLogistics1", "0xLogistics2"]
 *                         insurance: "0xInsurance1"
 *                         inspector: "0xInspector1"
 *                         status: "active"
 *                         currentStage: "shipping"
 *                         lastUpdated: 1699999999
 *                       history:
 *                         - action: "created"
 *                           txHash: "0xTxHash1"
 *                           account: "0xExporter1"
 *                           exporter: "0xExporter1"
 *                           importer: "0xImporter1"
 *                           logistics: ["0xLogistics1"]
 *                           insurance: "0xInsurance1"
 *                           inspector: "0xInspector1"
 *                           requiredAmount: "1000"
 *                           extra: { notes: "Initial contract creation" }
 *                           timestamp: 1699990000
 *                           onChainInfo:
 *                             status: "success"
 *                             blockNumber: 123456
 *                             confirmations: 12
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while fetching user contracts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user contracts"
 */
router.get("/my", authMiddleware, ContractController.getUserContracts)

/**
 * @swagger
 * /api/contract/{address}/details:
 *   get:
 *     tags: [Contracts]
 *     summary: Get detailed information about a specific contract
 *     description: Retrieve full details and history of a specific smart contract by its address.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address
 *         example: "0xContractAddress1"
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContractLogs'
 *             examples:
 *               success:
 *                 summary: Example contract details
 *                 value:
 *                   success: true
 *                   data:
 *                     contractAddress: "0xContractAddress1"
 *                     state:
 *                       exporter: "0xExporter1"
 *                       importer: "0xImporter1"
 *                       logistics: ["0xLogistics1", "0xLogistics2"]
 *                       insurance: "0xInsurance1"
 *                       inspector: "0xInspector1"
 *                       status: "active"
 *                       currentStage: "shipping"
 *                       lastUpdated: 1699999999
 *                     history:
 *                       - action: "created"
 *                         txHash: "0xTxHash1"
 *                         account: "0xExporter1"
 *                         exporter: "0xExporter1"
 *                         importer: "0xImporter1"
 *                         logistics: ["0xLogistics1"]
 *                         insurance: "0xInsurance1"
 *                         inspector: "0xInspector1"
 *                         requiredAmount: "1000"
 *                         extra: { notes: "Initial contract creation" }
 *                         timestamp: 1699990000
 *                         onChainInfo:
 *                           status: "success"
 *                           blockNumber: 123456
 *                           confirmations: 12
 *
 *       400:
 *         description: Missing contract address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Contract address is required"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Contract not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Contract not found"
 *
 *       500:
 *         description: Server error while fetching contract details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch contract details"
 */
router.get("/:address/details", authMiddleware, ContractController.getContractDetails)

/**
 * @swagger
 * /api/contract/{address}/step:
 *   get:
 *     tags: [Contracts]
 *     summary: Get current lifecycle step/status of a specific contract
 *     description: Retrieve the current state and lifecycle step of a smart contract by its address.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address
 *         example: "0xContractAddress1"
 *     responses:
 *       200:
 *         description: Contract current step/status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContractState'
 *             examples:
 *               success:
 *                 summary: Example contract current state
 *                 value:
 *                   success: true
 *                   data:
 *                     exporter: "0xExporter1"
 *                     importer: "0xImporter1"
 *                     logistics: ["0xLogistics1", "0xLogistics2"]
 *                     insurance: "0xInsurance1"
 *                     inspector: "0xInspector1"
 *                     status: "active"
 *                     currentStage: "shipping"
 *                     lastUpdated: 1699999999
 *
 *       400:
 *         description: Missing contract address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Contract address is required"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Contract not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Contract not found"
 *
 *       500:
 *         description: Server error while fetching contract step
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch contract step"
 */
router.get("/:address/step", authMiddleware, ContractController.getContractStep)

/**
 * @swagger
 * /api/contract:
 *   get:
 *     tags: [Contracts]
 *     summary: Get all deployed contracts in the system
 *     description: Retrieve a list of all smart contracts deployed in the system. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all deployed contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContractLogs'
 *             examples:
 *               success:
 *                 summary: Example list of deployed contracts
 *                 value:
 *                   success: true
 *                   data:
 *                     - contractAddress: "0xContractAddress1"
 *                       state:
 *                         exporter: "0xExporter1"
 *                         importer: "0xImporter1"
 *                         logistics: ["0xLogistics1", "0xLogistics2"]
 *                         insurance: "0xInsurance1"
 *                         inspector: "0xInspector1"
 *                         status: "active"
 *                         currentStage: "shipping"
 *                         lastUpdated: 1699999999
 *                       history:
 *                         - action: "created"
 *                           txHash: "0xTxHash1"
 *                           account: "0xExporter1"
 *                           exporter: "0xExporter1"
 *                           importer: "0xImporter1"
 *                           logistics: ["0xLogistics1"]
 *                           insurance: "0xInsurance1"
 *                           inspector: "0xInspector1"
 *                           requiredAmount: "1000"
 *                           extra: { notes: "Initial contract creation" }
 *                           timestamp: 1699990000
 *                           onChainInfo:
 *                             status: "success"
 *                             blockNumber: 123456
 *                             confirmations: 12
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while fetching deployed contracts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch deployed contracts"
 */
router.get("/", authMiddleware, ContractController.fetchDeployedContracts)

/**
 * @swagger
 * /api/contract/log:
 *   post:
 *     tags: [Contracts]
 *     summary: Add a new contract log and update its state
 *     description: "Add a new log entry to a smart contract and optionally update its state. Required fields: \"contractAddress\", \"action\", \"txHash\", \"account\"."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractLogEntry'
 *           examples:
 *             newLog:
 *               summary: Example new contract log entry
 *               value:
 *                 contractAddress: "0xContractAddress1"
 *                 action: "shipped"
 *                 txHash: "0xTxHash2"
 *                 account: "0xLogistics1"
 *                 exporter: "0xExporter1"
 *                 importer: "0xImporter1"
 *                 logistics: ["0xLogistics1"]
 *                 insurance: "0xInsurance1"
 *                 inspector: "0xInspector1"
 *                 requiredAmount: "1000"
 *                 extra: { notes: "Goods shipped" }
 *                 timestamp: 1699995000
 *                 onChainInfo:
 *                   status: "success"
 *                   blockNumber: 123460
 *                   confirmations: 8
 *                 verifyOnChain: true
 *     responses:
 *       201:
 *         description: Newly created contract log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContractLogEntry'
 *             examples:
 *               created:
 *                 summary: Example response after creating log
 *                 value:
 *                   success: true
 *                   data:
 *                     contractAddress: "0xContractAddress1"
 *                     action: "shipped"
 *                     txHash: "0xTxHash2"
 *                     account: "0xLogistics1"
 *                     exporter: "0xExporter1"
 *                     importer: "0xImporter1"
 *                     logistics: ["0xLogistics1"]
 *                     insurance: "0xInsurance1"
 *                     inspector: "0xInspector1"
 *                     requiredAmount: "1000"
 *                     extra: { notes: "Goods shipped" }
 *                     timestamp: 1699995000
 *                     onChainInfo:
 *                       status: "success"
 *                       blockNumber: 123460
 *                       confirmations: 8
 *                     verifyOnChain: true
 *
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing required fields: contractAddress, action, txHash, account"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while logging contract action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to log contract action"
 */
router.post("/log", authMiddleware, ContractController.logContractAction)

export default router;
