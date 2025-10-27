import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { KYCModel } from "../models/kycModel.js";
import { notifyWithAdmins, notifyUsers } from "../utils/notificationHelper.js";
import type { KYC, KYCLogEntry, KYCStatus } from "../types/Kyc.js";
import type { UserMetadata } from "../types/User.js";
import KYCDTO from "../dtos/kycDTO.js";
import { UserService } from "./userService.js";

export class KYCService {
  // --- Upload file langsung ke KYC-service (FastAPI /trade-chain) ---
  static async uploadKYCStream(file: Express.Multer.File, walletAddress: string, tokenId: string) {
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

  // --- Create KYC ---
  static async createKYC(
    data: Partial<KYC> & { file?: Express.Multer.File },
    executor: string,
    txHash: string
  ) {
    let uploadResult;

    if (data.file) {
      uploadResult = await this.uploadKYCStream(data.file, data.owner!, data.tokenId!.toString());
    }

    const tokenId = uploadResult?.tokenId || data.tokenId || uuidv4();

    const dto = new KYCDTO({
      ...data,
      tokenId,
      status: uploadResult?.status || data.status || "Pending",
      documentUrl: uploadResult?.documentUrl || data.documentUrl,
    });

    // --- Create KYC record di Firestore ---
    const created = await KYCModel.create(dto.toFirestore());

    // --- Buat initial log otomatis ---
    const initialLog: KYCLogEntry = {
      action: "mintKYC",
      txHash,
      account: created.owner,
      executor,
      timestamp: Date.now(),
    };
    await KYCModel.addLog(created.tokenId, initialLog);

    // --- Notify admins ---
    await notifyWithAdmins(executor, {
      type: "kyc",
      title: `KYC Created: ${created.tokenId}`,
      message: `KYC for owner ${created.owner} created by ${executor}.`,
      data: created,
    });

    return created;
  }

  // --- Update KYC ---
  static async updateKYC(
    tokenId: string,
    data: Partial<KYC>,
    action?: KYCLogEntry["action"],
    txHash?: string,
    executor?: string
  ) {
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
      
      // Notify to KYC owner
      await notifyUsers(updated.owner, {
        type: "kyc",
        title: `Your KYC Updated: ${action}`,
        message: `Your KYC (${tokenId}) has been updated by ${executor}.`,
        data: updated,
      }, executor);
    }

    return updated;
  }

  // --- Delete KYC ---
  static async deleteKYC(
    tokenId: string,
    action?: KYCLogEntry["action"],
    txHash?: string,
    executor?: string
  ) {
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

  // --- Get KYC by tokenId ---
  static async getKYCById(tokenId: string) {
    const kyc = await KYCModel.getById(tokenId);
    if (!kyc) return null;
    const history = await KYCModel.getLogs(tokenId);
    return { ...kyc, history };
  }

  // --- Get all KYCs ---
  static async getAllKYC() {
    const kycs = await KYCModel.getAll();
    return Promise.all(
      kycs.map(async (kyc) => ({
        ...kyc,
        history: await KYCModel.getLogs(kyc.tokenId),
      }))
    );
  }

  // --- Get KYCs by owner ---
  static async getKYCByOwner(owner: string) {
    const kycs = await KYCModel.getByOwner(owner);
    return Promise.all(
      kycs.map(async (kyc) => ({
        ...kyc,
        history: await KYCModel.getLogs(kyc.tokenId),
      }))
    );
  }
  
  // --- Internal: Update KYC (status, signature, etc.) ---
  static async updateKYCInternal(
    tokenId: string,
    data: Partial<Pick<KYC, "status" | "reviewedBy" | "signature" | "remarks">> & { txHash?: string }
  ) {
    const existing = await KYCModel.getById(tokenId);
    if (!existing) throw new Error("KYC not found");

    // Gabungkan data lama + baru
    const merged = new KYCDTO({ ...existing, ...data });
    const updated = await KYCModel.update(tokenId, merged.toFirestore());
    if (!updated) throw new Error("Failed to update KYC");

    // --- Update status user bila perlu ---
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

    // --- Tambah log internal ---
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

    // --- Notifikasi admin ---
    await notifyWithAdmins("system", {
      type: "kyc",
      title: `KYC Internal Update: ${tokenId}`,
      message: `KYC ${tokenId} was internally updated to status "${data.status}".`,
      data: updated,
    });

    // --- Notifikasi ke user ---
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

