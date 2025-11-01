/**
 * @file documentRoutes.ts
 * @description Routes for managing trade-related and KYC-linked documents.
 * Supports CRUD operations, logs, and document associations by contract or owner.
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
} from "../controllers/documentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * Attach a new document to a specific contract
 * @route POST /contract/:addr/docs
 * @group Document
 * @security BearerAuth
 * @param {string} addr.path.required - Contract address
 * @param {object} body.required - Document payload
 * @returns {object} 201 - Created document
 */
router.post("/contract/:addr/docs", authMiddleware, attachDocument);

/**
 * Get all documents
 * @route GET /documents
 * @group Document
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of documents
 */
router.get("/", authMiddleware, getAllDocuments);

/**
 * Get all documents for a specific owner
 * @route GET /documents/owner/:owner
 * @group Document
 * @security BearerAuth
 * @param {string} owner.path.required - Owner wallet address
 * @returns {Array<object>} 200 - List of documents
 */
router.get("/owner/:owner", authMiddleware, getDocumentsByOwner);

/**
 * Get all documents linked to a specific contract
 * @route GET /documents/contract/:addr
 * @group Document
 * @security BearerAuth
 * @param {string} addr.path.required - Contract address
 * @returns {Array<object>} 200 - List of documents
 */
router.get("/contract/:addr", authMiddleware, getDocumentsByContract);

/**
 * Get a document by token ID
 * @route GET /documents/:tokenId
 * @group Document
 * @security BearerAuth
 * @param {number} tokenId.path.required - Document token ID
 * @returns {object} 200 - Document details
 */
router.get("/:tokenId", authMiddleware, getDocument);

/**
 * Get activity logs for a specific document
 * @route GET /documents/:tokenId/logs
 * @group Document
 * @security BearerAuth
 * @param {number} tokenId.path.required - Document token ID
 * @returns {Array<object>} 200 - List of document logs
 */
router.get("/:tokenId/logs", authMiddleware, getDocumentLogs);

/**
 * Update document metadata
 * @route PATCH /documents/:tokenId
 * @group Document
 * @security BearerAuth
 * @param {number} tokenId.path.required - Document token ID
 * @param {object} body.required - Fields to update
 * @returns {object} 200 - Updated document
 */
router.patch("/:tokenId", authMiddleware, updateDocument);

/**
 * Delete a document
 * @route DELETE /documents/:tokenId
 * @group Document
 * @security BearerAuth
 * @param {number} tokenId.path.required - Document token ID
 * @returns {object} 200 - Success message
 */
router.delete("/:tokenId", authMiddleware, deleteDocument);

export default router;
