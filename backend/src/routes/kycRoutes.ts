/**
 * @file kycRoutes.ts
 * @description Express router for KYC with Swagger/OpenAPI 3.0 documentation
 */

import express, { Router } from "express";
import {
  createKYC,
  getAllKYCs,
  getKYCById,
  getKYCsByOwner,
  updateKYC,
  deleteKYC,
  getKYCLogs,
  updateKYCInternal,
} from "../controllers/kycController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";

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
 *     KYCDTO:
 *       type: object
 *       required:
 *         - tokenId
 *         - owner
 *         - fileHash
 *         - metadataUrl
 *       properties:
 *         tokenId:
 *           type: string
 *           example: "kyc-uuid-123"
 *         owner:
 *           type: string
 *           example: "0x123abc..."
 *         fileHash:
 *           type: string
 *           example: "Qmabcdef..."
 *         metadataUrl:
 *           type: string
 *           example: "https://ipfs.io/ipfs/Qmabcdef..."
 *         documentUrl:
 *           type: string
 *           example: "https://storage.example.com/docs/kyc-123.pdf"
 *         name:
 *           type: string
 *           example: "NFT-123"
 *         description:
 *           type: string
 *           example: "KYC for user 0x123abc..."
 *         txHash:
 *           type: string
 *           example: "0xabc123..."
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *         status:
 *           type: string
 *           enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *           example: "Pending"
 *
 * tags:
 *   - name: KYC
 *     description: Endpoints to manage KYC records
 */

/**
 * @swagger
 * /api/kyc/internal/{tokenId}/status:
 *   patch:
 *     tags: [KYC]
 *     summary: Internal update of KYC status
 *     description: Update the status of a KYC record internally. Requires internal authorization.
 *     security:
 *       - internalBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: KYC token ID
 *         example: "kyc-uuid-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *                 description: Status to update
 *                 example: "Reviewed"
 *               reviewedBy:
 *                 type: string
 *                 description: Internal reviewer name/email
 *                 example: "admin@example.com"
 *               signature:
 *                 type: string
 *                 description: Optional signature hash
 *                 example: "0xSignatureHash"
 *               txHash:
 *                 type: string
 *                 description: Optional transaction hash
 *                 example: "0xTransactionHash"
 *               remarks:
 *                 type: string
 *                 description: Optional remarks or notes
 *                 example: "Verified and approved"
 *     responses:
 *       200:
 *         description: Updated KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   tokenId: "kyc-uuid-123"
 *                   owner: "0x123abc..."
 *                   fileHash: "Qmabcdef..."
 *                   metadataUrl: "https://ipfs.io/ipfs/Qmabcdef..."
 *                   documentUrl: "https://storage.example.com/docs/kyc-123.pdf"
 *                   name: "NFT-123"
 *                   description: "KYC for user 0x123abc..."
 *                   txHash: "0xabc123..."
 *                   status: "Reviewed"
 *                   reviewedBy: "admin@example.com"
 *                   signature: "0xSignatureHash"
 *                   remarks: "Verified and approved"
 *                   createdAt: 1699286400000
 *                   updatedAt: 1699372800000
 *       400:
 *         description: Missing or invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing status field"
 *       401:
 *         description: Unauthorized — invalid internal bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal authentication failed"
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "KYC record not found"
 *       422:
 *         description: Invalid or missing path parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing tokenId parameter"
 *       500:
 *         description: Server error while updating KYC
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update KYC status"
 */
router.patch("/internal/:tokenId/status", internalAuthMiddleware, express.json(), updateKYCInternal);

/**
 * @swagger
 * /api/kyc:
 *   post:
 *     tags: [KYC]
 *     summary: Create a new KYC record
 *     description: Upload a new KYC document and create a record in the system.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - owner
 *               - file
 *               - fileHash
 *               - metadataUrl
 *               - action
 *               - executor
 *             properties:
 *               owner:
 *                 type: string
 *                 example: "0x123abc..."
 *                 description: Wallet address of the KYC owner
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: KYC document file to upload
 *               fileHash:
 *                 type: string
 *                 example: "Qmabcdef..."
 *                 description: IPFS hash of the uploaded file
 *               metadataUrl:
 *                 type: string
 *                 example: "https://ipfs.io/ipfs/Qmabcdef..."
 *                 description: URL pointing to the metadata JSON
 *               name:
 *                 type: string
 *                 example: "NFT-123"
 *                 description: Optional name for the KYC
 *               description:
 *                 type: string
 *                 example: "KYC for user 0x123abc..."
 *                 description: Optional description
 *               status:
 *                 type: string
 *                 enum: ["Draft","Reviewed","Signed","Revoked"]
 *                 example: "Draft"
 *                 description: Optional status
 *               action:
 *                 type: string
 *                 example: "create"
 *                 description: Action performed for logging (required)
 *               executor:
 *                 type: string
 *                 example: "admin@example.com"
 *                 description: User performing the action (required)
 *               txHash:
 *                 type: string
 *                 example: "0xabc123..."
 *                 description: Optional transaction hash
 *     responses:
 *       201:
 *         description: Created KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   tokenId: "kyc-uuid-123"
 *                   owner: "0x123abc..."
 *                   fileHash: "Qmabcdef..."
 *                   metadataUrl: "https://ipfs.io/ipfs/Qmabcdef..."
 *                   documentUrl: "https://storage.example.com/docs/kyc-123.pdf"
 *                   name: "NFT-123"
 *                   description: "KYC for user 0x123abc..."
 *                   txHash: "0xabc123..."
 *                   status: "Draft"
 *                   createdAt: 1699286400000
 *                   updatedAt: 1699372800000
 *       400:
 *         description: Missing required fields or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "Missing required KYC fields"
 *               missingAction:
 *                 summary: Missing action field
 *                 value:
 *                   success: false
 *                   message: "Missing action field"
 *               missingExecutor:
 *                 summary: Missing executor field
 *                 value:
 *                   success: false
 *                   message: "Missing executor field"
 *       401:
 *         description: Unauthorized — invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       500:
 *         description: Server error while creating KYC
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create KYC"
 */
router.post("/", authMiddleware, createKYC);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   patch:
 *     tags: [KYC]
 *     summary: Update an existing KYC record
 *     description: Update fields of an existing KYC record including status, name, description, and linked metadata. Requires `action` and `executor` for logging.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *         example: "kyc-uuid-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               owner:
 *                 type: string
 *               fileHash:
 *                 type: string
 *               metadataUrl:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["Draft","Reviewed","Signed","Revoked"]
 *               action:
 *                 type: string
 *                 example: "update"
 *                 description: Action performed for logging (required)
 *               executor:
 *                 type: string
 *                 example: "admin@example.com"
 *                 description: User performing the action (required)
 *               txHash:
 *                 type: string
 *                 example: "0xabc123..."
 *                 description: Optional transaction hash
 *     responses:
 *       200:
 *         description: Updated KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 *             examples:
 *               success:
 *                 summary: Example updated KYC response
 *                 value:
 *                   tokenId: "kyc-uuid-123"
 *                   owner: "0x123abc..."
 *                   fileHash: "Qmabcdef..."
 *                   metadataUrl: "https://ipfs.io/ipfs/Qmabcdef..."
 *                   documentUrl: "https://storage.example.com/docs/kyc-123.pdf"
 *                   name: "NFT-123"
 *                   description: "Updated KYC info"
 *                   txHash: "0xabc123..."
 *                   status: "Reviewed"
 *                   createdAt: 1699286400000
 *                   updatedAt: 1699372800000
 *       400:
 *         description: Missing required fields (action or executor)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAction:
 *                 summary: Missing action field
 *                 value:
 *                   success: false
 *                   message: "Missing action field"
 *               missingExecutor:
 *                 summary: Missing executor field
 *                 value:
 *                   success: false
 *                   message: "Missing executor field"
 *       401:
 *         description: Unauthorized — Invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "KYC not found"
 *       422:
 *         description: Invalid or missing tokenId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing tokenId parameter"
 *       500:
 *         description: Server error while updating KYC
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update KYC"
 */
router.patch("/:tokenId", authMiddleware, express.json(), updateKYC);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   delete:
 *     tags: [KYC]
 *     summary: Delete a KYC record
 *     description: Delete a KYC record by token ID. Requires `action` and `executor` fields in the request body.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *         example: "kyc-uuid-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - executor
 *             properties:
 *               action:
 *                 type: string
 *                 example: "delete"
 *                 description: Action performed for logging
 *               executor:
 *                 type: string
 *                 example: "admin@example.com"
 *                 description: User performing the action
 *               txHash:
 *                 type: string
 *                 example: "0xabc123..."
 *                 description: Optional transaction hash
 *     responses:
 *       200:
 *         description: KYC deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KYC deleted successfully"
 *       400:
 *         description: Missing required fields (action or executor)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAction:
 *                 summary: Missing action field
 *                 value:
 *                   success: false
 *                   message: "Missing action field"
 *               missingExecutor:
 *                 summary: Missing executor field
 *                 value:
 *                   success: false
 *                   message: "Missing executor field"
 *       401:
 *         description: Unauthorized — Invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "KYC record not found"
 *       422:
 *         description: Invalid or missing tokenId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing tokenId parameter"
 *       500:
 *         description: Server error while deleting KYC
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete KYC"
 */
router.delete("/:tokenId", authMiddleware, express.json(), deleteKYC);

/**
 * @swagger
 * /api/kyc:
 *   get:
 *     tags: [KYC]
 *     summary: Get all KYC records
 *     description: Fetch all KYC records in the system. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all KYC records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KYCDTO'
 *       401:
 *         description: Unauthorized — Invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       500:
 *         description: Server error while fetching KYC records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch KYCs"
 */
router.get("/", authMiddleware, getAllKYCs);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   get:
 *     tags: [KYC]
 *     summary: Get KYC record by token ID
 *     description: Fetch a specific KYC record by its token ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *         example: "kyc-uuid-123"
 *     responses:
 *       200:
 *         description: KYC record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 *             examples:
 *               success:
 *                 summary: Example KYC response
 *                 value:
 *                   tokenId: "kyc-uuid-123"
 *                   owner: "0x123abc..."
 *                   fileHash: "Qmabcdef..."
 *                   metadataUrl: "https://ipfs.io/ipfs/Qmabcdef..."
 *                   documentUrl: "https://storage.example.com/docs/kyc-123.pdf"
 *                   name: "NFT-123"
 *                   description: "KYC for user 0x123abc..."
 *                   txHash: "0xabc123..."
 *                   status: "Draft"
 *                   createdAt: 1699286400000
 *                   updatedAt: 1699372800000
 *
 *       401:
 *         description: Unauthorized — Invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "KYC not found"
 *
 *       422:
 *         description: Missing or invalid tokenId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing tokenId parameter"
 *
 *       500:
 *         description: Server error while fetching the KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch KYC by ID"
 */
router.get("/:tokenId", authMiddleware, getKYCById);

/**
 * @swagger
 * /api/kyc/owner/{owner}:
 *   get:
 *     tags: [KYC]
 *     summary: Get all KYC records for a specific owner
 *     description: Fetch all KYC records associated with a given owner wallet address. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner
 *         schema:
 *           type: string
 *         required: true
 *         description: Owner wallet address
 *         example: "0x123abc..."
 *     responses:
 *       200:
 *         description: List of KYC records for the owner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KYCDTO'
 *             examples:
 *               success:
 *                 summary: Example list of KYC records
 *                 value:
 *                   - tokenId: "kyc-uuid-123"
 *                     owner: "0x123abc..."
 *                     fileHash: "Qmabcdef..."
 *                     metadataUrl: "https://ipfs.io/ipfs/Qmabcdef..."
 *                     documentUrl: "https://storage.example.com/docs/kyc-123.pdf"
 *                     name: "NFT-123"
 *                     description: "KYC for user 0x123abc..."
 *                     txHash: "0xabc123..."
 *                     status: "Draft"
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *                   - tokenId: "kyc-uuid-124"
 *                     owner: "0x123abc..."
 *                     fileHash: "Qmghijkl..."
 *                     metadataUrl: "https://ipfs.io/ipfs/Qmghijkl..."
 *                     documentUrl: "https://storage.example.com/docs/kyc-124.pdf"
 *                     name: "NFT-124"
 *                     description: "KYC for user 0x123abc..."
 *                     txHash: "0xdef456..."
 *                     status: "Reviewed"
 *                     createdAt: 1699386400000
 *                     updatedAt: 1699472800000
 *
 *       401:
 *         description: Unauthorized — Invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: No KYC records found for this owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No KYC records found for owner"
 *
 *       422:
 *         description: Missing owner parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing owner parameter"
 *
 *       500:
 *         description: Server error while fetching KYC records for owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch KYCs for owner"
 */
router.get("/owner/:owner", authMiddleware, getKYCsByOwner);

/**
 * @swagger
 * /api/kyc/{tokenId}/logs:
 *   get:
 *     tags: [KYC]
 *     summary: Get KYC activity logs
 *     description: Retrieve the history/logs of actions performed on a specific KYC record. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *         example: "kyc-uuid-123"
 *     responses:
 *       200:
 *         description: List of KYC logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     example: "Reviewed"
 *                   executor:
 *                     type: string
 *                     example: "admin@example.com"
 *                   timestamp:
 *                     type: integer
 *                     example: 1699286400000
 *                   txHash:
 *                     type: string
 *                     example: "0xabc123..."
 *                   remarks:
 *                     type: string
 *                     example: "Verified documents"
 *             examples:
 *               success:
 *                 summary: Example logs
 *                 value:
 *                   - action: "Created"
 *                     executor: "admin@example.com"
 *                     timestamp: 1699286400000
 *                     txHash: "0xabc123..."
 *                     remarks: "Initial KYC upload"
 *                   - action: "Reviewed"
 *                     executor: "admin@example.com"
 *                     timestamp: 1699372800000
 *                     txHash: "0xdef456..."
 *                     remarks: "Verified documents"
 *
 *       401:
 *         description: Unauthorized — Invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: No logs found for the given KYC token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No logs found"
 *
 *       422:
 *         description: Missing tokenId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing tokenId parameter"
 *
 *       500:
 *         description: Server error while fetching KYC logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch KYC logs"
 */
router.get("/:tokenId/logs", authMiddleware, getKYCLogs);

export default router;
