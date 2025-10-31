import express, { Router } from "express"
import {
  createKYC,
  getAllKYCs,
  getKYCById,
  getKYCsByOwner,
  updateKYC,
  deleteKYC,
  getKYCLogs,
  updateKYCInternal,
} from "../controllers/kycController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware.js"

const router = Router()

/**
 * --- KYC Routes ---
 * Manage user KYC creation, updates, logs, and internal status updates
 */

/**
 * -------------------- Internal Routes --------------------
 */

/**
 * PATCH /kyc/internal/:tokenId/status
 * Internal use only — update KYC verification status (used by backend services)
 */
router.patch(
  "/internal/:tokenId/status",
  internalAuthMiddleware,
  express.json(),
  updateKYCInternal
)

/**
 * -------------------- Public Routes --------------------
 */

/**
 * POST /kyc
 * Create a new KYC record (supports file upload)
 */
router.post("/", authMiddleware, createKYC)

/**
 * PATCH /kyc/:tokenId
 * Update an existing KYC (JSON body only)
 */
router.patch("/:tokenId", authMiddleware, express.json(), updateKYC)

/**
 * DELETE /kyc/:tokenId
 * Delete a specific KYC record
 */
router.delete("/:tokenId", authMiddleware, express.json(), deleteKYC)

/**
 * GET /kyc
 * Get all KYC records (admin or authorized access)
 */
router.get("/", authMiddleware, getAllKYCs)

/**
 * GET /kyc/:tokenId
 * Get KYC record by token ID
 */
router.get("/:tokenId", authMiddleware, getKYCById)

/**
 * GET /kyc/owner/:owner
 * Get all KYC records belonging to a specific owner address
 */
router.get("/owner/:owner", authMiddleware, getKYCsByOwner)

/**
 * GET /kyc/:tokenId/logs
 * Get full activity logs for a specific KYC token
 */
router.get("/:tokenId/logs", authMiddleware, getKYCLogs)

export default router
