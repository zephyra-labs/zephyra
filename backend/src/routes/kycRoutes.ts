/**
 * @file kycRoutes.ts
 * @description Routes for managing KYC records: creation, updates, deletion, logs, and internal status updates
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
 * -------------------- Internal Routes --------------------
 */

/**
 * Internal: Update KYC status
 * @route PATCH /kyc/internal/:tokenId/status
 * @group KYC
 * @security InternalBearerAuth
 * @param {string} tokenId.path.required - KYC token ID
 * @param {object} body - Status update payload
 * @returns {object} 200 - Updated KYC record
 */
router.patch(
  "/internal/:tokenId/status",
  internalAuthMiddleware,
  express.json(),
  updateKYCInternal
);

/**
 * -------------------- Public Routes --------------------
 */

/**
 * Create a new KYC record
 * @route POST /kyc
 * @group KYC
 * @security BearerAuth
 * @param {multipart/form-data} file - KYC document file
 * @param {string} body - Other KYC fields (owner, fileHash, metadataUrl, etc.)
 * @returns {object} 201 - Created KYC record
 */
router.post("/", authMiddleware, createKYC);

/**
 * Update an existing KYC record
 * @route PATCH /kyc/:tokenId
 * @group KYC
 * @security BearerAuth
 * @param {string} tokenId.path.required - KYC token ID
 * @param {object} body - Fields to update
 * @returns {object} 200 - Updated KYC record
 */
router.patch("/:tokenId", authMiddleware, express.json(), updateKYC);

/**
 * Delete a specific KYC record
 * @route DELETE /kyc/:tokenId
 * @group KYC
 * @security BearerAuth
 * @param {string} tokenId.path.required - KYC token ID
 * @returns {object} 200 - Success message
 */
router.delete("/:tokenId", authMiddleware, express.json(), deleteKYC);

/**
 * Get all KYC records
 * @route GET /kyc
 * @group KYC
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of all KYC records
 */
router.get("/", authMiddleware, getAllKYCs);

/**
 * Get KYC record by token ID
 * @route GET /kyc/:tokenId
 * @group KYC
 * @security BearerAuth
 * @param {string} tokenId.path.required - KYC token ID
 * @returns {object} 200 - KYC record
 */
router.get("/:tokenId", authMiddleware, getKYCById);

/**
 * Get all KYC records for a specific owner
 * @route GET /kyc/owner/:owner
 * @group KYC
 * @security BearerAuth
 * @param {string} owner.path.required - Owner wallet address
 * @returns {Array<object>} 200 - List of KYC records
 */
router.get("/owner/:owner", authMiddleware, getKYCsByOwner);

/**
 * Get KYC activity logs
 * @route GET /kyc/:tokenId/logs
 * @group KYC
 * @security BearerAuth
 * @param {string} tokenId.path.required - KYC token ID
 * @returns {Array<object>} 200 - List of KYC activity logs
 */
router.get("/:tokenId/logs", authMiddleware, getKYCLogs);

export default router;
