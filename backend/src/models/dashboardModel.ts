/**
 * @file DashboardModel.ts
 * @description Firestore model for dashboard-related queries
 */

import { db } from "../config/firebase.js";

/** Firestore collection references */
const usersCollection = db.collection("users");
const contractsLogsCollection = db.collection("contractLogs");
const documentsCollection = db.collection("documents");
const documentLogsCollection = db.collection("documentLogs");

/**
 * Firestore model for dashboard queries (users, contracts, documents, document logs)
 */
export class DashboardModel {
  /**
   * Get all users
   * @returns Array of users with id, address, and balance
   */
  static async getAllUsers(): Promise<{ id: string; address?: string; balance?: number }[]> {
    const snap = await usersCollection.get();
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as { address?: string; balance?: number }),
    }));
  }

  /**
   * Get all contracts
   * @returns Array of contracts with id and history
   */
  static async getAllContracts(): Promise<{ id: string; history?: any[] }[]> {
    const snap = await contractsLogsCollection.get();
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as { history?: any[] }),
    }));
  }

  /**
   * Get all documents
   * @returns Array of documents with id, title, tokenId, owner, docType, status, createdAt, updatedAt, linkedContracts
   */
  static async getAllDocuments(): Promise<
    {
      id: string;
      title?: string;
      tokenId?: string;
      owner?: string;
      docType?: string;
      status?: string;
      createdAt?: number;
      updatedAt?: number;
      linkedContracts?: string[];
    }[]
  > {
    const snap = await documentsCollection.get();
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as {
        title?: string;
        tokenId?: string;
        owner?: string;
        docType?: string;
        status?: string;
        createdAt?: number;
        updatedAt?: number;
        linkedContracts?: string[];
      }),
    }));
  }

  /**
   * Get document logs for a specific document
   * @param id Document token ID
   * @returns Array of document log entries
   */
  static async getDocumentLogs(id: string): Promise<any[]> {
    const snap = await documentLogsCollection.doc(id).get();
    return snap.exists ? (snap.data()?.history ?? []) : [];
  }
}
