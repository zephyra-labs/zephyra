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

// --- POST /contract/:addr/docs
router.post("/contract/:addr/docs", authMiddleware, attachDocument);

// --- GET /documents
router.get("/", authMiddleware, getAllDocuments);

// --- GET documents by owner
router.get("/owner/:owner", authMiddleware, getDocumentsByOwner);

// --- GET documents by contract
router.get("/contract/:addr", authMiddleware, getDocumentsByContract);

// --- GET single document by tokenId
router.get("/:tokenId", authMiddleware, getDocument);

// --- GET document logs by tokenId
router.get("/:tokenId/logs", authMiddleware, getDocumentLogs);

// --- PATCH /documents/:tokenId
router.patch("/:tokenId", authMiddleware, updateDocument);

// --- DELETE /documents/:tokenId
router.delete("/:tokenId", authMiddleware, deleteDocument);

export default router;
