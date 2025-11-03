/**
 * @file documentService.ts
 * @description Business logic for managing documents, including create, update, delete,
 * retrieval, logging per contract, and notifications to admins/users.
 */

import { getAddress } from "viem";
import { DocumentModel } from "../models/documentModel";
import DocumentDTO from "../dtos/documentDTO";
import type { Document, DocumentLogEntry } from "../types/Document";
import { notifyWithAdmins, notifyUsers } from "../utils/notificationHelper";
import { getContractRoles } from "../utils/getContractRoles";

/**
 * Safely normalizes and validates an Ethereum address.
 * @param {string | null | undefined} addr - Address to validate.
 * @returns {string} Checksummed address.
 * @throws {Error} If address is missing or invalid.
 */
function safeAddress(addr?: string | null): string {
  if (!addr) throw new Error("Address missing or invalid");
  return getAddress(addr);
}

export class DocumentService {
  /**
   * Creates a new document, validates linked contracts, adds logs, and notifies users/admins.
   *
   * @async
   * @param {Partial<Document>} data - Document data to create.
   * @param {string} account - Wallet/account performing the creation.
   * @param {DocumentLogEntry["action"]} action - Action type for logging.
   * @param {string} [txHash] - Optional transaction hash.
   * @returns {Promise<Document>} The created document.
   * @throws {Error} If validation fails or document cannot be created.
   */
  static async createDocument(
    data: Partial<Document>,
    account: string,
    action: DocumentLogEntry["action"],
    txHash?: string
  ): Promise<Document> {
    const dto = new DocumentDTO(data);
    if (!dto.linkedContracts?.length) throw new Error("Document must link to at least one contract");

    const normalized = safeAddress(account);
    const recipientsToNotify: string[] = [];

    // Validate contracts & roles
    for (const c of dto.linkedContracts) {
      const roles = await getContractRoles(c);
      const importer = roles.importer ? safeAddress(roles.importer) : null;
      const exporter = roles.exporter ? safeAddress(roles.exporter) : null;
      const logistics = roles.logistics ? safeAddress(roles.logistics) : null;

      if (!importer && !exporter && !logistics) throw new Error(`Contract ${c} has no assigned roles`);
      if (normalized !== importer && normalized !== exporter && normalized !== logistics)
        throw new Error(`Unauthorized account for ${c}`);

      if (importer) recipientsToNotify.push(importer);
      if (exporter) recipientsToNotify.push(exporter);
      if (logistics) recipientsToNotify.push(logistics);
    }

    // Save document
    const newDoc = await DocumentModel.create(dto.toFirestore());

    // Create logs per linked contract
    for (const c of dto.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: dto.signer,
        linkedContract: c,
        timestamp: Date.now(),
      };
      await DocumentModel.addLog(dto.tokenId, log);
    }

    // Notify admins & linked users
    const payload = {
      type: "document" as const,
      title: `Document ${action}`,
      message: `Document ${dto.tokenId} ${action} by ${normalized}`,
      txHash,
      data: { tokenId: dto.tokenId, action, linkedContracts: dto.linkedContracts },
    };

    await notifyWithAdmins(normalized, payload);
    await notifyUsers(recipientsToNotify.filter(r => r !== normalized), payload, normalized);

    return newDoc;
  }

  /**
   * Updates an existing document, adds logs for linked contracts, and notifies users/admins.
   *
   * @async
   * @param {number} tokenId - Document ID to update.
   * @param {Partial<Document>} data - Fields to update.
   * @param {string} account - Wallet/account performing the update.
   * @param {DocumentLogEntry["action"]} action - Action type for logging.
   * @param {string} [txHash] - Optional transaction hash.
   * @returns {Promise<Document>} Updated document.
   * @throws {Error} If document not found or update fails.
   */
  static async updateDocument(
    tokenId: number,
    data: Partial<Document>,
    account: string,
    action: DocumentLogEntry["action"],
    txHash?: string
  ): Promise<Document> {
    const existing = await DocumentModel.getById(tokenId);
    if (!existing) throw new Error(`Document ${tokenId} not found`);

    const normalized = safeAddress(account);
    const updated = await DocumentModel.update(tokenId, data);
    if (!updated) throw new Error(`Failed to update document ${tokenId}`);

    const recipientsToNotify: string[] = [];
    for (const c of existing.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: existing.signer ?? normalized,
        linkedContract: c,
        timestamp: Date.now(),
      };
      await DocumentModel.addLog(tokenId, log);

      const roles = await getContractRoles(c);
      if (roles.importer) recipientsToNotify.push(safeAddress(roles.importer));
      if (roles.exporter) recipientsToNotify.push(safeAddress(roles.exporter));
      if (roles.logistics) recipientsToNotify.push(safeAddress(roles.logistics));
    }

    const payload = {
      type: "document" as const,
      title: `Document Updated`,
      message: `Document ${tokenId} updated by ${normalized}`,
      txHash,
      data: { tokenId, action, linkedContracts: existing.linkedContracts },
    };

    await notifyWithAdmins(normalized, payload);
    await notifyUsers(recipientsToNotify.filter(r => r !== normalized), payload, normalized);

    return updated;
  }

  /**
   * Deletes a document, logs the action, and notifies admins.
   *
   * @async
   * @param {number} tokenId - Document ID to delete.
   * @param {string} account - Wallet/account performing deletion.
   * @param {DocumentLogEntry["action"]} action - Action type for logging.
   * @param {string} [txHash] - Optional transaction hash.
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise.
   */
  static async deleteDocument(
    tokenId: number,
    account: string,
    action: DocumentLogEntry["action"],
    txHash?: string
  ): Promise<boolean> {
    const existing = await DocumentModel.getById(tokenId);
    if (!existing) return false;

    const normalized = safeAddress(account);
    const success = await DocumentModel.delete(tokenId);
    if (!success) return false;

    for (const c of existing.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: existing.signer,
        linkedContract: c,
        timestamp: Date.now(),
      };
      await DocumentModel.addLog(tokenId, log);
    }

    const payload = {
      type: "document" as const,
      title: `Document Deleted`,
      message: `Document ${tokenId} deleted by ${normalized}`,
      txHash,
      data: { tokenId, action, linkedContracts: existing.linkedContracts },
    };

    await notifyWithAdmins(normalized, payload);
    await notifyUsers([], payload, normalized);

    return true;
  }

  /**
   * Retrieves all documents with their log histories.
   *
   * @async
   * @returns {Promise<(Document & { history: DocumentLogEntry[] })[]>} List of documents with logs.
   */
  static async getAllDocuments(): Promise<(Document & { history: DocumentLogEntry[] })[]> {
    const docs = await DocumentModel.getAll();
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })));
  }

  /**
   * Retrieves a document by ID including its log history.
   *
   * @async
   * @param {number} tokenId - Document ID.
   * @returns {Promise<(Document & { history: DocumentLogEntry[] }) | null>} Document with logs or null.
   */
  static async getDocumentById(tokenId: number): Promise<(Document & { history: DocumentLogEntry[] }) | null> {
    const doc = await DocumentModel.getById(tokenId);
    if (!doc) return null;
    const history = await DocumentModel.getLogs(tokenId);
    return { ...doc, history };
  }

  /**
   * Retrieves all documents owned by a specific wallet/account.
   *
   * @async
   * @param {string} owner - Owner wallet address.
   * @returns {Promise<(Document & { history: DocumentLogEntry[] })[]>} Documents with logs.
   */
  static async getDocumentsByOwner(owner: string): Promise<(Document & { history: DocumentLogEntry[] })[]> {
    const docs = await DocumentModel.getByOwner(owner);
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })));
  }

  /**
   * Retrieves all documents linked to a specific contract.
   *
   * @async
   * @param {string} contract - Contract address.
   * @returns {Promise<(Document & { history: DocumentLogEntry[] })[]>} Documents with logs.
   */
  static async getDocumentsByContract(contract: string): Promise<(Document & { history: DocumentLogEntry[] })[]> {
    const docs = await DocumentModel.getByContract(contract);
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })));
  }
}
