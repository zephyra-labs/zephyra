/**
 * @file kycController.ts
 * @description Express controller for KYC operations.
 * Handles creation, update, deletion, retrieval, and internal status updates.
 */

import type { Request, Response } from "express";
import { KYCService } from "../services/kycService.js";
import multer from "multer";
import { success, failure } from "../utils/responseHelper.js";

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// --- Create KYC ---
/**
 * Handles the creation of a new KYC record.
 * Accepts multipart form-data for file upload.
 *
 * @route POST /kyc
 * @middleware multer.single("file")
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with created KYC or error.
 */
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
/**
 * Updates an existing KYC record.
 *
 * @route PUT /kyc/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with updated KYC or error.
 */
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
/**
 * Deletes a KYC record by tokenId.
 *
 * @route DELETE /kyc/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with deletion status or error.
 */
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
/**
 * Retrieves all KYC records.
 *
 * @route GET /kyc
 * @param {Request} _req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with all KYCs or error.
 */
export const getAllKYCs = async (_req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getAllKYC();
    return success(res, kycs);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get KYC by tokenId ---
/**
 * Retrieves a KYC record by its tokenId.
 *
 * @route GET /kyc/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with KYC or error.
 */
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
/**
 * Retrieves all KYC records for a specific owner.
 *
 * @route GET /kyc/owner/:owner
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with KYCs for owner or error.
 */
export const getKYCsByOwner = async (req: Request, res: Response) => {
  try {
    const kycs = await KYCService.getKYCByOwner(req.params.owner);
    return success(res, kycs);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
};

// --- Get KYC Logs ---
/**
 * Retrieves history/logs of a specific KYC record.
 *
 * @route GET /kyc/:tokenId/logs
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with KYC logs or error.
 */
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
/**
 * Updates KYC status internally (used by system or admin operations).
 *
 * @route PATCH /kyc/internal/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with updated KYC or error.
 */
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
