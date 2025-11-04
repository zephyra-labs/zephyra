/**
 * @file TradeModel.ts
 * @description Firestore model for managing trade records, participants, and statuses.
 */

import { db } from "../config/firebase";
import type { TradeRecord, TradeParticipant, TradeStatus } from "../types/Trade";

/** Firestore collection reference for trade records */
const collection = db.collection("tradeRecords");

/**
 * Model class for performing CRUD and domain operations on trade records.
 * Provides convenience methods for participant management and trade status updates.
 * @class
 */
export class TradeModel {
  /**
   * Create or update a trade record in Firestore.
   * If the record already exists, it updates `updatedAt` automatically.
   * @async
   * @param {TradeRecord} record - The trade record to create or update.
   * @returns {Promise<void>}
   */
  static async upsertTradeRecord(record: TradeRecord): Promise<void> {
    const docRef = collection.doc(record.id);
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({
        ...record,
        updatedAt: Date.now(),
      });
    } else {
      await docRef.set({
        ...record,
        createdAt: Date.now(),
        updatedAt: record.updatedAt ?? null,
      });
    }
  }

  /**
   * Retrieve all trade records from Firestore.
   * @async
   * @returns {Promise<TradeRecord[]>} Array of all trade records.
   */
  static async getAllTrades(): Promise<TradeRecord[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TradeRecord));
  }

  /**
   * Retrieve a single trade record by its ID.
   * @async
   * @param {string} id - The ID of the trade record.
   * @returns {Promise<TradeRecord | null>} The trade record if found, otherwise `null`.
   */
  static async getTradeById(id: string): Promise<TradeRecord | null> {
    const doc = await collection.doc(id).get();
    return doc.exists ? (doc.data() as TradeRecord) : null;
  }

  /**
   * Retrieve trade records that include a specific participant.
   * @async
   * @param {string} address - The wallet address of the participant.
   * @returns {Promise<TradeRecord[]>} List of trade records containing the participant.
   */
  static async getTradesByParticipant(address: string): Promise<TradeRecord[]> {
    const snapshot = await collection.where("participants", "array-contains", { address }).get();
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TradeRecord));
  }

  /**
   * Update the role of a participant within a trade record.
   * @async
   * @param {string} tradeId - The ID of the trade record.
   * @param {string} participantAddress - The address of the participant to update.
   * @param {TradeParticipant['role']} role - The new role to assign to the participant.
   * @returns {Promise<TradeParticipant[]>} The updated list of participants.
   * @throws {Error} If the trade record is not found.
   */
  static async updateParticipantRole(
    tradeId: string,
    participantAddress: string,
    role: TradeParticipant["role"]
  ): Promise<TradeParticipant[]> {
    const docRef = collection.doc(tradeId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("TradeRecord not found");

    const record = doc.data() as TradeRecord;
    const participants = record.participants.map((p) =>
      p.address === participantAddress ? { ...p, role } : p
    );

    await docRef.update({
      participants,
      updatedAt: Date.now(),
    });

    return participants;
  }

  /**
   * Update the status of a trade record.
   * Automatically refreshes the `updatedAt` timestamp.
   * @async
   * @param {string} tradeId - The ID of the trade record.
   * @param {TradeStatus} status - The new trade status to set.
   * @returns {Promise<void>}
   * @throws {Error} If the trade record is not found.
   */
  static async updateTradeStatus(tradeId: string, status: TradeStatus): Promise<void> {
    const docRef = collection.doc(tradeId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("TradeRecord not found");

    await docRef.update({
      status,
      updatedAt: Date.now(),
    });
  }
}
