import express from "express"
import { Router } from "express"
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

// -------------------- Internal Routes --------------------

// Internal: Update KYC status
router.patch(
  "/internal/:tokenId/status",
  internalAuthMiddleware,
  express.json(),
  updateKYCInternal
)

// -------------------- Public Routes --------------------

// Create new KYC (with file)
router.post("/", authMiddleware, createKYC)

// Update KYC (JSON body)
router.patch("/:tokenId", authMiddleware, express.json(), updateKYC)

// Delete KYC
router.delete("/:tokenId", authMiddleware, express.json(), deleteKYC)

// Get all KYCs
router.get("/", authMiddleware, getAllKYCs)

// Get KYC by tokenId
router.get("/:tokenId", authMiddleware, getKYCById)

// Get KYCs by owner
router.get("/owner/:owner", authMiddleware, getKYCsByOwner)

// Get KYC Logs
router.get("/:tokenId/logs", authMiddleware, getKYCLogs)

export default router
