/**
 * @file DashboardModel.ts
 * @description Firestore model for dashboard-related queries (users, contracts, documents, and document logs)
 */

import { db } from "../config/firebase";
import type { User } from "../types/User";
import type { ContractLogs } from "../types/Contract";
import type { Document, DocumentLogs, DocumentLogEntry } from "../types/Document";

/** Firestore collection references */
const usersCollection = db.collection("users");
const contractsLogsCollection = db.collection("contractLogs");
const documentsCollection = db.collection("documents");
const documentLogsCollection = db.collection("documentLogs");

/**
 * Firestore model for dashboard data aggregation and overview queries.
 */
export class DashboardModel {
  /**
   * Get all users stored in Firestore.
   * @returns Promise resolving to an array of users with ID, address, and balance (if available)
   */
  static async getAllUsers(): Promise<
    ({ id: string } & Pick<User, "address"> & { balance?: number })[]
  > {
    const snap = await usersCollection.get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Pick<User, "address"> & { balance?: number }),
    }));
  }

  /**
   * Get all contracts with their histories.
   * @returns Promise resolving to an array of contract logs summaries.
   */
  static async getAllContracts(): Promise<
    ({ id: string; history?: ContractLogs["history"] })[]
  > {
    const snap = await contractsLogsCollection.get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as { history?: ContractLogs["history"] }),
    }));
  }

  /**
   * Get all documents with minimal dashboard fields.
   * @returns Promise resolving to an array of documents with key properties.
   */
  static async getAllDocuments(): Promise<
    ({
      id: string;
      title?: string;
    } & Pick<
      Document,
      | "tokenId"
      | "owner"
      | "docType"
      | "status"
      | "createdAt"
      | "updatedAt"
      | "linkedContracts"
    >)[]
  > {
    const snap = await documentsCollection.get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Pick<
        Document,
        | "tokenId"
        | "owner"
        | "docType"
        | "status"
        | "createdAt"
        | "updatedAt"
        | "linkedContracts"
      > & { title?: string }),
    }));
  }

  /**
   * Get all log entries associated with a document.
   * @param id - The document token ID.
   * @returns Promise resolving to an array of document log entries.
   */
  static async getDocumentLogs(id: string): Promise<DocumentLogEntry[]> {
    const snap = await documentLogsCollection.doc(id).get();
    return snap.exists
      ? ((snap.data() as DocumentLogs)?.history ?? [])
      : [];
  }
}
