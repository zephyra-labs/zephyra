/**
 * @file kycService.ts
 * @description Business logic for KYC operations including creation, update, deletion, retrieval,
 * file upload to KYC service, and notification handling.
 */

import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { KYCModel } from "../models/kycModel";
import { notifyWithAdmins, notifyUsers } from "../utils/notificationHelper";
import type { KYC, KYCLogEntry, KYCStatus, KYCUploadResponse } from "../types/Kyc";
import type { UserMetadata } from "../types/User";
import KYCDTO from "../dtos/kycDTO";
import { UserService } from "./userService";

export class KYCService {
  /**
   * Uploads a KYC document file to the external KYC service (FastAPI/trade-chain).
   *
   * @async
   * @param {Express.Multer.File} file - File to upload.
   * @param {string} walletAddress - Wallet address of the KYC owner.
   * @param {string} tokenId - Unique token ID for the KYC.
   * @returns {Promise<any>} Response data from the KYC service.
   * @throws {Error} If upload fails.
   */
  static async uploadKYCStream(file: Express.Multer.File, walletAddress: string, tokenId: string): Promise<KYCUploadResponse> {
    const form = new FormData();
    form.append("wallet_address", walletAddress);
    form.append("token_id", tokenId);
    form.append("file", file.buffer, file.originalname);

    const response = await axios.post(
      `${process.env.KYC_SERVICE_URL}/documents/trade-chain`,
      form,
      { headers: form.getHeaders() }
    );

    return response.data;
  }

  /**
   * Creates a new KYC record, optionally uploading the file, logging the action,
   * and notifying admins.
   *
   * @async
   * @param {Partial<KYC> & { file?: Express.Multer.File }} data - KYC data to create.
   * @param {string} executor - User ID or system performing the action.
   * @param {string} txHash - Transaction hash associated with the KYC creation.
   * @returns {Promise<KYC>} The created KYC record.
   * @throws {Error} If creation or file upload fails.
   */
  static async createKYC(
    data: Partial<KYC> & { file?: Express.Multer.File },
    executor: string,
    txHash: string
  ): Promise<KYC> {
    let uploadResult;

    if (data.file) {
      uploadResult = await this.uploadKYCStream(data.file, data.owner!, data.tokenId!.toString());
    }

    const tokenId = uploadResult?.tokenId || data.tokenId || uuidv4();
    const dto = new KYCDTO({
      ...data,
      tokenId,
      status: uploadResult?.status || data.status || "Draft",
      documentUrl: uploadResult?.documentUrl || data.documentUrl,
    });

    const created = await KYCModel.create(dto.toFirestore());

    const initialLog: KYCLogEntry = {
      action: "mintKYC",
      txHash,
      account: created.owner,
      executor,
      timestamp: Date.now(),
    };
    await KYCModel.addLog(created.tokenId, initialLog);

    await notifyWithAdmins(executor, {
      type: "kyc",
      title: `KYC Created: ${created.tokenId}`,
      message: `KYC for owner ${created.owner} created by ${executor}.`,
      data: created,
    });

    return created;
  }

  /**
   * Updates an existing KYC record, logs the action, updates user KYC status,
   * and sends notifications to admins and user.
   *
   * @async
   * @param {string} tokenId - KYC token ID to update.
   * @param {Partial<KYC>} data - Data fields to update.
   * @param {KYCLogEntry["action"]} [action] - Optional action name for logging.
   * @param {string} [txHash] - Optional transaction hash.
   * @param {string} [executor] - User performing the update.
   * @returns {Promise<KYC>} Updated KYC record.
   * @throws {Error} If KYC not found or update fails.
   */
  static async updateKYC(
    tokenId: string,
    data: Partial<KYC>,
    action?: KYCLogEntry["action"],
    txHash?: string,
    executor?: string
  ): Promise<KYC> {
    const existing = await KYCModel.getById(tokenId);
    if (!existing) throw new Error("KYC not found");

    const merged = new KYCDTO({ ...existing, ...data });
    const updated = await KYCModel.update(tokenId, merged.toFirestore());
    if (!updated) throw new Error("Failed to update KYC");

    const kycToUserStatusMap: Record<
      KYCStatus | "Draft" | "Reviewed" | "Signed" | "Revoked",
      UserMetadata["kycStatus"]
    > = {
      Draft: "pending",
      Reviewed: "pending",
      Signed: "approved",
      Revoked: "rejected",
    };

    const newUserStatus = kycToUserStatusMap[data.status as keyof typeof kycToUserStatusMap];
    if (newUserStatus) {
      await UserService.updateKYCStatus(updated.owner, newUserStatus);
    }

    if (action && executor) {
      const log: KYCLogEntry = {
        action,
        txHash: txHash || "",
        account: updated.owner,
        executor,
        timestamp: Date.now(),
      };
      await KYCModel.addLog(tokenId, log);

      await notifyWithAdmins(executor, {
        type: "kyc",
        title: `KYC Updated: ${action}`,
        message: `KYC ${tokenId} updated by ${executor}.`,
        data: updated,
      });

      await notifyUsers(updated.owner, {
        type: "kyc",
        title: `Your KYC Updated: ${action}`,
        message: `Your KYC (${tokenId}) has been updated by ${executor}.`,
        data: updated,
      }, executor);
    }

    return updated;
  }

  /**
   * Deletes a KYC record, logs the action, and notifies admins.
   *
   * @async
   * @param {string} tokenId - KYC token ID to delete.
   * @param {KYCLogEntry["action"]} [action] - Optional log action.
   * @param {string} [txHash] - Optional transaction hash.
   * @param {string} [executor] - User performing deletion.
   * @returns {Promise<boolean>} True if deletion succeeded.
   * @throws {Error} If KYC not found or deletion fails.
   */
  static async deleteKYC(
    tokenId: string,
    action?: KYCLogEntry["action"],
    txHash?: string,
    executor?: string
  ): Promise<boolean> {
    const deleted = await KYCModel.delete(tokenId);
    if (!deleted) throw new Error("KYC not found");

    if (action && executor) {
      const log: KYCLogEntry = {
        action,
        txHash: txHash || "",
        account: deleted.owner,
        executor,
        timestamp: Date.now(),
      };
      await KYCModel.addLog(tokenId, log);

      await notifyWithAdmins(executor, {
        type: "kyc",
        title: `KYC Deleted: ${tokenId}`,
        message: `KYC ${tokenId} deleted by ${executor}.`,
        data: deleted,
      });
    }

    return true;
  }

  /**
   * Retrieves a KYC record by token ID, including its log history.
   *
   * @async
   * @param {string} tokenId - KYC token ID.
   * @returns {Promise<(KYC & { history: KYCLogEntry[] }) | null>} KYC record with logs or null.
   */
  static async getKYCById(tokenId: string): Promise<(KYC & { history: KYCLogEntry[] }) | null> {
    const kyc = await KYCModel.getById(tokenId);
    if (!kyc) return null;
    const history = await KYCModel.getLogs(tokenId);
    return { ...kyc, history };
  }

  /**
   * Retrieves all KYC records, including their log histories.
   *
   * @async
   * @returns {Promise<(KYC & { history: KYCLogEntry[] })[]>} List of all KYCs with logs.
   */
  static async getAllKYC(): Promise<(KYC & { history: KYCLogEntry[] })[]> {
    const kycs = await KYCModel.getAll();
    return Promise.all(
      kycs.map(async (kyc) => ({
        ...kyc,
        history: await KYCModel.getLogs(kyc.tokenId),
      }))
    );
  }

  /**
   * Retrieves all KYC records for a specific owner, including log histories.
   *
   * @async
   * @param {string} owner - Wallet address of the KYC owner.
   * @returns {Promise<(KYC & { history: KYCLogEntry[] })[]>} List of KYCs with logs for the owner.
   */
  static async getKYCByOwner(owner: string): Promise<(KYC & { history: KYCLogEntry[] })[]> {
    const kycs = await KYCModel.getByOwner(owner);
    return Promise.all(
      kycs.map(async (kyc) => ({
        ...kyc,
        history: await KYCModel.getLogs(kyc.tokenId),
      }))
    );
  }

  /**
   * Internal update for KYC (status, signature, remarks, etc.), logs internally,
   * updates user KYC status, and notifies admins and user.
   *
   * @async
   * @param {string} tokenId - KYC token ID to update.
   * @param {Partial<Pick<KYC, "status" | "reviewedBy" | "signature" | "remarks">> & { txHash?: string }} data
   * @returns {Promise<KYC>} Updated KYC record.
   * @throws {Error} If KYC not found or update fails.
   */
  static async updateKYCInternal(
    tokenId: string,
    data: Partial<Pick<KYC, "status" | "reviewedBy" | "signature" | "remarks">> & { txHash?: string }
  ): Promise<KYC> {
    const existing = await KYCModel.getById(tokenId);
    if (!existing) throw new Error("KYC not found");

    const merged = new KYCDTO({ ...existing, ...data });
    const updated = await KYCModel.update(tokenId, merged.toFirestore());
    if (!updated) throw new Error("Failed to update KYC");

    const kycToUserStatusMap: Record<
      KYCStatus | "Draft" | "Reviewed" | "Signed" | "Revoked",
      UserMetadata["kycStatus"]
    > = {
      Draft: "pending",
      Reviewed: "pending",
      Signed: "approved",
      Revoked: "rejected",
    };

    const newUserStatus = kycToUserStatusMap[data.status as keyof typeof kycToUserStatusMap];
    if (newUserStatus) {
      await UserService.updateKYCStatus(updated.owner, newUserStatus);
    }

    const log: KYCLogEntry = {
      action: "internal_update",
      txHash: data.txHash || "",
      account: updated.owner,
      executor: "system",
      timestamp: Date.now(),
      details: {
        status: data.status,
        reviewedBy: data.reviewedBy,
        signature: data.signature,
      },
    };
    await KYCModel.addLog(tokenId, log);

    await notifyWithAdmins("system", {
      type: "kyc",
      title: `KYC Internal Update: ${tokenId}`,
      message: `KYC ${tokenId} was internally updated to status "${data.status}".`,
      data: updated,
    });

    if (updated.owner) {
      await notifyUsers(updated.owner, {
        type: "kyc",
        title: `KYC Status Updated`,
        message: `Your KYC (${tokenId}) has been updated to "${data.status}".`,
        data: updated,
      }, "system");
    }

    return updated;
  }
}
