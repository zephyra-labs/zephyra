/**
 * @file KYCModel.ts
 * @description Firestore model for managing KYC (Know Your Customer) records and their logs.
 */

import type { KYC, KYCLogs, KYCLogEntry } from "../types/Kyc";
import { db } from "../config/firebase";

/** Firestore collection reference for KYC records */
const collection = db.collection("KYCs");

/** Firestore collection reference for KYC logs */
const logsCollection = db.collection("KYCLogs");

/**
 * @class KYCModel
 * @description Provides CRUD operations for KYC entities and log management in Firestore.
 */
export class KYCModel {
  /**
   * Create a new KYC document in Firestore.
   * @async
   * @param {KYC} data - The KYC data to create.
   * @returns {Promise<KYC>} The created KYC document.
   * @example
   * await KYCModel.create({ tokenId: "123", owner: "0xabc...", fileHash: "xyz", metadataUrl: "...", status: "Pending" });
   */
  static async create(data: KYC): Promise<KYC> {
    const docRef = collection.doc(data.tokenId);
    await docRef.set(data);
    return data;
  }

  /**
   * Update an existing KYC record.
   * @async
   * @param {string} tokenId - The KYC token ID to update.
   * @param {Partial<KYC>} data - Partial fields to update in the KYC document.
   * @returns {Promise<KYC | null>} The updated KYC document, or `null` if not found.
   * @example
   * await KYCModel.update("123", { status: "Approved" });
   */
  static async update(tokenId: string, data: Partial<KYC>): Promise<KYC | null> {
    const docRef = collection.doc(tokenId);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updated = { ...doc.data(), ...data } as KYC;
    await docRef.update(updated as FirebaseFirestore.DocumentData);
    return updated;
  }

  /**
   * Delete a KYC record by token ID.
   * @async
   * @param {string} tokenId - The KYC token ID to delete.
   * @returns {Promise<KYC | null>} The deleted KYC data, or `null` if not found.
   * @example
   * await KYCModel.delete("123");
   */
  static async delete(tokenId: string): Promise<KYC | null> {
    const docRef = collection.doc(tokenId);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data() as KYC;
    await docRef.delete();
    return data;
  }

  /**
   * Retrieve all KYC records.
   * @async
   * @returns {Promise<KYC[]>} An array of all KYC documents.
   * @example
   * const allKyc = await KYCModel.getAll();
   */
  static async getAll(): Promise<KYC[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => doc.data() as KYC);
  }

  /**
   * Retrieve a KYC record by token ID.
   * @async
   * @param {string} tokenId - The KYC token ID to retrieve.
   * @returns {Promise<KYC | null>} The KYC document if found, otherwise `null`.
   * @example
   * const record = await KYCModel.getById("123");
   */
  static async getById(tokenId: string): Promise<KYC | null> {
    const doc = await collection.doc(tokenId).get();
    return doc.exists ? (doc.data() as KYC) : null;
  }

  /**
   * Retrieve all KYC records for a specific owner.
   * @async
   * @param {string} owner - The wallet address or identifier of the KYC owner.
   * @returns {Promise<KYC[]>} Array of KYC records belonging to the specified owner.
   * @example
   * const userKycs = await KYCModel.getByOwner("0xabc...");
   */
  static async getByOwner(owner: string): Promise<KYC[]> {
    const snapshot = await collection.where("owner", "==", owner).get();
    return snapshot.docs.map(doc => doc.data() as KYC);
  }

  // ----------------------------
  // LOGS MANAGEMENT
  // ----------------------------

  /**
   * Add a log entry for a KYC record.
   * Creates a new log document if it doesn't exist.
   * @async
   * @param {string} tokenId - The KYC token ID to associate with the log.
   * @param {KYCLogEntry} entry - The log entry to add.
   * @returns {Promise<void>}
   * @example
   * await KYCModel.addLog("123", { timestamp: Date.now(), action: "Submitted", performedBy: "0xabc..." });
   */
  static async addLog(tokenId: string, entry: KYCLogEntry): Promise<void> {
    const ref = logsCollection.doc(tokenId);
    const snap = await ref.get();

    if (!snap.exists) {
      const newLog: KYCLogs = { tokenId: Number(tokenId), history: [entry] };
      await ref.set(newLog);
    } else {
      const current = snap.data() as KYCLogs;
      current.history.push(entry);
      await ref.update(current as FirebaseFirestore.DocumentData);
    }
  }

  /**
   * Retrieve all logs for a given KYC token.
   * @async
   * @param {string} tokenId - The KYC token ID to retrieve logs for.
   * @returns {Promise<KYCLogEntry[]>} Array of log entries (empty if none found).
   * @example
   * const logs = await KYCModel.getLogs("123");
   */
  static async getLogs(tokenId: string): Promise<KYCLogEntry[]> {
    const doc = await logsCollection.doc(tokenId).get();
    if (!doc.exists) return [];
    return (doc.data() as KYCLogs).history;
  }
}
