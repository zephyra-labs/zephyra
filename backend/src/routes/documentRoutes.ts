/**
 * @file documentRoutes.ts
 * @description Express router for Document management with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import {
  attachDocument,
  getDocument,
  getDocumentsByOwner,
  getDocumentsByContract,
  getDocumentLogs,
  updateDocument,
  deleteDocument,
  getAllDocuments,
} from "../controllers/documentController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentDTO:
 *       type: object
 *       required:
 *         - tokenId
 *         - owner
 *         - fileHash
 *         - uri
 *         - docType
 *       properties:
 *         tokenId:
 *           type: integer
 *           example: 123
 *         owner:
 *           type: string
 *           example: "0x123abc..."
 *         fileHash:
 *           type: string
 *           example: "Qmabcdef..."
 *         uri:
 *           type: string
 *           example: "https://storage.example.com/docs/doc-123.pdf"
 *         docType:
 *           type: string
 *           enum: ["Invoice","B/L","COO","PackingList","Other"]
 *           example: "Invoice"
 *         linkedContracts:
 *           type: array
 *           items:
 *             type: string
 *           example: ["0xcontract1", "0xcontract2"]
 *         status:
 *           type: string
 *           enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *           example: "Draft"
 *         signer:
 *           type: string
 *           example: "0xsigner..."
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *         name:
 *           type: string
 *           example: "Invoice #123"
 *         description:
 *           type: string
 *           example: "Invoice for trade #456"
 *         metadataUrl:
 *           type: string
 *           example: "https://metadata.example.com/doc-123.json"
 *
 * tags:
 *   - name: Document
 *     description: Endpoints to manage trade-related documents
 */

/**
 * @swagger
 * /api/document/contract/{addr}/docs:
 *   post:
 *     tags: [Document]
 *     summary: Attach a new document to a contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentDTO'
 *     responses:
 *       201:
 *         description: Created document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDTO'
 */
router.post("/contract/:addr/docs", authMiddleware, attachDocument);

/**
 * @swagger
 * /api/document:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 */
router.get("/", authMiddleware, getAllDocuments);

/**
 * @swagger
 * /api/document/owner/{owner}:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents for a specific owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner wallet address
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 */
router.get("/owner/:owner", authMiddleware, getDocumentsByOwner);

/**
 * @swagger
 * /api/document/contract/{addr}:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents linked to a contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address
 *     responses:
 *       200:
 *         description: List of documents linked to the contract
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 */
router.get("/contract/:addr", authMiddleware, getDocumentsByContract);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   get:
 *     tags: [Document]
 *     summary: Get a document by token ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDTO'
 */
router.get("/:tokenId", authMiddleware, getDocument);

/**
 * @swagger
 * /api/document/{tokenId}/logs:
 *   get:
 *     tags: [Document]
 *     summary: Get activity logs for a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *     responses:
 *       200:
 *         description: Document logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/:tokenId/logs", authMiddleware, getDocumentLogs);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   patch:
 *     tags: [Document]
 *     summary: Update a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentDTO'
 *     responses:
 *       200:
 *         description: Updated document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDTO'
 */
router.patch("/:tokenId", authMiddleware, updateDocument);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   delete:
 *     tags: [Document]
 *     summary: Delete a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Document deleted"
 */
router.delete("/:tokenId", authMiddleware, deleteDocument);

export default router;
