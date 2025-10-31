import { Router } from "express"
import {
  attachDocument,
  getDocument,
  getDocumentsByOwner,
  getDocumentsByContract,
  getDocumentLogs,
  updateDocument,
  deleteDocument,
  getAllDocuments,
} from "../controllers/documentController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

/**
 * --- Document Routes ---
 * Manage trade-related and KYC-linked document records.
 * Includes CRUD operations, logs, and document associations by contract or owner.
 */

/**
 * POST /contract/:addr/docs
 * Attach a new document to a specific contract address.
 */
router.post("/contract/:addr/docs", authMiddleware, attachDocument)

/**
 * GET /documents
 * Retrieve all documents (admin or authorized users).
 */
router.get("/", authMiddleware, getAllDocuments)

/**
 * GET /documents/owner/:owner
 * Retrieve all documents belonging to a specific wallet address.
 */
router.get("/owner/:owner", authMiddleware, getDocumentsByOwner)

/**
 * GET /documents/contract/:addr
 * Retrieve all documents linked to a specific contract address.
 */
router.get("/contract/:addr", authMiddleware, getDocumentsByContract)

/**
 * GET /documents/:tokenId
 * Retrieve a single document by its token ID.
 */
router.get("/:tokenId", authMiddleware, getDocument)

/**
 * GET /documents/:tokenId/logs
 * Retrieve full activity logs for a specific document.
 */
router.get("/:tokenId/logs", authMiddleware, getDocumentLogs)

/**
 * PATCH /documents/:tokenId
 * Update document metadata or information.
 */
router.patch("/:tokenId", authMiddleware, updateDocument)

/**
 * DELETE /documents/:tokenId
 * Delete a document by token ID.
 */
router.delete("/:tokenId", authMiddleware, deleteDocument)

export default router
