import type { Request, Response } from "express";
import { KYCService } from "../services/kycService.js";
import multer from "multer";

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// --- Create KYC ---
export const createKYC = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const { tokenId, owner, fileHash, metadataUrl, name, description, status, action, executor, txHash } = body;

      if (!owner || !fileHash || !metadataUrl) {
        return res.status(400).json({ success: false, message: "Missing required KYC fields" });
      }
      if (!action) return res.status(400).json({ success: false, message: "Missing action field" });
      if (!executor) return res.status(400).json({ success: false, message: "Missing executor field" });

      const created = await KYCService.createKYC(
        { tokenId, owner, fileHash, metadataUrl, name, description, status, file: req.file },
        executor,
        txHash
      );

      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
];

// --- Update KYC ---
export const updateKYC = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const tokenId = req.params.tokenId;
    const { action, executor, txHash, ...updateData } = body;

    if (!action) return res.status(400).json({ success: false, message: "Missing action field" });
    if (!executor) return res.status(400).json({ success: false, message: "Missing executor field" });

    const updated = await KYCService.updateKYC(tokenId, updateData, action, txHash, executor);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Delete KYC ---
export const deleteKYC = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const tokenId = req.params.tokenId;
    const { action, executor, txHash } = body;

    if (!action) return res.status(400).json({ success: false, message: "Missing action field" });
    if (!executor) return res.status(400).json({ success: false, message: "Missing executor field" });

    await KYCService.deleteKYC(tokenId, action, txHash, executor);
    return res.json({ success: true, message: "KYC deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Get all KYCs ---
export const getAllKYCs = async (_req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getAllKYC();
    return res.json({ success: true, data: kycs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Get KYC by tokenId ---
export const getKYCById = async (req: Request, res: Response) => {
  try {
    const kyc = await KYCService.getKYCById(req.params.tokenId);
    if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });
    return res.json({ success: true, data: kyc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Get KYCs by owner ---
export const getKYCsByOwner = async (req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getKYCByOwner(req.params.owner);
    return res.json({ success: true, data: kycs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Get KYC Logs ---
export const getKYCLogs = async (req: Request, res: Response) => {
  try {
    const kyc = await KYCService.getKYCById(req.params.tokenId);
    if (!kyc) return res.status(404).json({ success: false, message: "No logs found" });
    return res.json({ success: true, data: kyc.history ?? [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Internal: Update KYC status ---
export const updateKYCInternal = async (req: Request, res: Response) => {
  try {
    const tokenId = req.params.tokenId;
    const body = req.body || {};
    const { status, reviewedBy, signature, txHash, remarks } = body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Missing status field" });
    }

    const updated = await KYCService.updateKYCInternal(tokenId, {
      status,
      reviewedBy,
      signature,
      txHash,
      remarks,
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};