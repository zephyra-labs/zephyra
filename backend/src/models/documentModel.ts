/**
 * @file DocumentModel.ts
 * @description Firestore model for Documents and DocumentLogs.
 */

import { db } from "../config/firebase";
import type { Document, DocumentLogs, DocumentLogEntry } from "../types/Document";

/** Firestore collection references */
const collection = db.collection("documents");
const logsCollection = db.collection("documentLogs");

/**
 * Firestore model for managing documents
 */
export class DocumentModel {
  /**
   * Create a new document
   * @param doc Document data
   * @returns Created document
   * @throws Error if document already exists
   */
  static async create(doc: Document): Promise<Document> {
    const ref = collection.doc(doc.tokenId.toString());
    const snap = await ref.get();
    if (snap.exists) throw new Error(`Document ${doc.tokenId} already exists`);
    await ref.set(doc);
    return doc;
  }

  /**
   * Update an existing document
   * @param tokenId Document token ID
   * @param data Partial document data to update
   * @returns Updated document or null if not found
   */
  static async update(tokenId: number, data: Partial<Document>): Promise<Document | null> {
    const ref = collection.doc(tokenId.toString());
    const snap = await ref.get();
    if (!snap.exists) return null;

    const existing = snap.data() as Document;
    const updated: Document = { ...existing, ...data, updatedAt: Date.now() };

    // Use type-safe object spreading instead of casting to any
    await ref.update({ ...updated });
    return updated;
  }

  /**
   * Delete a document
   * @param tokenId Document token ID
   * @returns True if deleted, false if not found
   */
  static async delete(tokenId: number): Promise<boolean> {
    const ref = collection.doc(tokenId.toString());
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
  }

  /**
   * Get a single document by tokenId
   * @param tokenId Document token ID
   * @returns Document or null if not found
   */
  static async getById(tokenId: number): Promise<Document | null> {
    const snap = await collection.doc(tokenId.toString()).get();
    return snap.exists ? (snap.data() as Document) : null;
  }

  /**
   * Get all documents
   * @returns List of documents
   */
  static async getAll(): Promise<Document[]> {
    const snap = await collection.get();
    return snap.docs.map((d) => d.data() as Document);
  }

  /**
   * Get documents by owner
   * @param owner Wallet address of owner
   * @returns List of documents owned by the owner
   */
  static async getByOwner(owner: string): Promise<Document[]> {
    const snap = await collection.where("owner", "==", owner).get();
    return snap.docs.map((d) => d.data() as Document);
  }

  /**
   * Get documents linked to a specific contract
   * @param contractAddress Contract address
   * @returns List of documents linked to the contract
   */
  static async getByContract(contractAddress: string): Promise<Document[]> {
    const snap = await collection.where("linkedContracts", "array-contains", contractAddress).get();
    return snap.docs.map((d) => d.data() as Document);
  }

  /**
   * Add a log entry for a document
   * @param tokenId Document token ID
   * @param log Log entry
   */
  static async addLog(tokenId: number, log: DocumentLogEntry): Promise<void> {
    const logRef = logsCollection.doc(tokenId.toString());
    const snap = await logRef.get();

    if (!snap.exists) {
      const newLog: DocumentLogs = {
        tokenId,
        contractAddress: log.linkedContract || "",
        history: [log],
      };
      await logRef.set(newLog);
    } else {
      const existing = snap.data() as DocumentLogs;
      const updatedLogs: DocumentLogs = {
        ...existing,
        history: [...existing.history, log],
      };
      await logRef.update({ ...updatedLogs });
    }
  }

  /**
   * Get all logs for a document
   * @param tokenId Document token ID
   * @returns List of log entries
   */
  static async getLogs(tokenId: number): Promise<DocumentLogEntry[]> {
    const snap = await logsCollection.doc(tokenId.toString()).get();
    return snap.exists ? (snap.data() as DocumentLogs).history : [];
  }
}
