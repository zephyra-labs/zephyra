import type { Request, Response } from "express";
import { KYCService } from "../services/kycService.js";
import multer from "multer";
import { success, failure } from "../utils/responseHelper.js";

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// --- Create KYC ---
export const createKYC = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const { tokenId, owner, fileHash, metadataUrl, name, description, status, action, executor, txHash } = body;

      if (!owner || !fileHash || !metadataUrl) {
        return failure(res, "Missing required KYC fields", 400);
      }
      if (!action) return failure(res, "Missing action field", 400);
      if (!executor) return failure(res, "Missing executor field", 400);

      const created = await KYCService.createKYC(
        { tokenId, owner, fileHash, metadataUrl, name, description, status, file: req.file },
        executor,
        txHash
      );

      return success(res, created, 201);
    } catch (err: any) {
      return failure(res, err.message, 400);
    }
  },
];

// --- Update KYC ---
export const updateKYC = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const tokenId = req.params.tokenId;
    const { action, executor, txHash, ...updateData } = body;

    if (!action) return failure(res, "Missing action field", 400);
    if (!executor) return failure(res, "Missing executor field", 400);

    const updated = await KYCService.updateKYC(tokenId, updateData, action, txHash, executor);
    return success(res, updated);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Delete KYC ---
export const deleteKYC = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const tokenId = req.params.tokenId;
    const { action, executor, txHash } = body;

    if (!action) return failure(res, "Missing action field", 400);
    if (!executor) return failure(res, "Missing executor field", 400);

    await KYCService.deleteKYC(tokenId, action, txHash, executor);
    return success(res, { message: "KYC deleted successfully" });
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get all KYCs ---
export const getAllKYCs = async (_req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getAllKYC();
    return success(res, kycs);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get KYC by tokenId ---
export const getKYCById = async (req: Request, res: Response) => {
  try {
    const kyc = await KYCService.getKYCById(req.params.tokenId);
    if (!kyc) return failure(res, "KYC not found", 404);
    return success(res, kyc);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get KYCs by owner ---
export const getKYCsByOwner = async (req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getKYCByOwner(req.params.owner);
    return success(res, kycs);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get KYC Logs ---
export const getKYCLogs = async (req: Request, res: Response) => {
  try {
    const kyc = await KYCService.getKYCById(req.params.tokenId);
    if (!kyc) return failure(res, "No logs found", 404);
    return success(res, kyc.history ?? []);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Internal: Update KYC status ---
export const updateKYCInternal = async (req: Request, res: Response) => {
  try {
    const tokenId = req.params.tokenId;
    const body = req.body || {};
    const { status, reviewedBy, signature, txHash, remarks } = body;

    if (!status) return failure(res, "Missing status field", 400);

    const updated = await KYCService.updateKYCInternal(tokenId, {
      status,
      reviewedBy,
      signature,
      txHash,
      remarks,
    });

    return success(res, updated);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};
