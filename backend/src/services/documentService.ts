import { getAddress } from "viem"
import { DocumentModel } from "../models/documentModel.js"
import DocumentDTO from "../dtos/documentDTO.js"
import type { Document, DocumentLogEntry } from "../types/Document.js"
import { notifyWithAdmins, notifyUsers } from "../utils/notificationHelper.js"
import { getContractRoles } from "../utils/getContractRoles.js"

function safeAddress(addr?: string | null): string {
  if (!addr) throw new Error("Address missing or invalid")
  return getAddress(addr)
}

export class DocumentService {
  // --- Create new document ---
  static async createDocument(data: Partial<Document>, account: string, action: DocumentLogEntry["action"], txHash?: string): Promise<Document> {
    const dto = new DocumentDTO(data)
    if (!dto.linkedContracts?.length) throw new Error("Document must link to at least one contract")

    const normalized = safeAddress(account)
    const recipientsToNotify: string[] = []

    // Validate contracts & roles
    for (const c of dto.linkedContracts) {
      const roles = await getContractRoles(c)
      const importer = roles.importer ? safeAddress(roles.importer) : null
      const exporter = roles.exporter ? safeAddress(roles.exporter) : null
      const logistics = roles.logistics ? safeAddress(roles.logistics) : null

      if (!importer && !exporter && !logistics) throw new Error(`Contract ${c} has no assigned roles`)
      if (normalized !== importer && normalized !== exporter && normalized !== logistics) throw new Error(`Unauthorized account for ${c}`)

      if (importer) recipientsToNotify.push(importer)
      if (exporter) recipientsToNotify.push(exporter)
      if (logistics) recipientsToNotify.push(logistics)
    }

    // Save document
    const newDoc = await DocumentModel.create(dto.toFirestore())

    // Create log for each linked contract
    for (const c of dto.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: dto.signer,
        linkedContract: c,
        timestamp: Date.now(),
      }
      await DocumentModel.addLog(dto.tokenId, log)
    }

    // Notify admins & users
    const payload = {
      type: "document" as const,
      title: `Document ${action}`,
      message: `Document ${dto.tokenId} ${action} by ${normalized}`,
      txHash,
      data: { tokenId: dto.tokenId, action, linkedContracts: dto.linkedContracts },
    }

    await notifyWithAdmins(normalized, payload)
    await notifyUsers(recipientsToNotify.filter(r => r !== normalized), payload, normalized)

    return newDoc
  }

  // --- Update ---
  static async updateDocument(tokenId: number, data: Partial<Document>, account: string, action: DocumentLogEntry["action"], txHash?: string) {
    const existing = await DocumentModel.getById(tokenId)
    if (!existing) throw new Error(`Document ${tokenId} not found`)

    const normalized = safeAddress(account)
    const updated = await DocumentModel.update(tokenId, data)
    if (!updated) throw new Error(`Failed to update document ${tokenId}`)

    // Add logs for linked contracts
    const recipientsToNotify: string[] = []
    for (const c of existing.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: existing.signer ?? normalized,
        linkedContract: c,
        timestamp: Date.now(),
      }
      await DocumentModel.addLog(tokenId, log)

      const roles = await getContractRoles(c)
      if (roles.importer) recipientsToNotify.push(safeAddress(roles.importer))
      if (roles.exporter) recipientsToNotify.push(safeAddress(roles.exporter))
      if (roles.logistics) recipientsToNotify.push(safeAddress(roles.logistics))
    }

    const payload = {
      type: "document" as const,
      title: `Document Updated`,
      message: `Document ${tokenId} updated by ${normalized}`,
      txHash,
      data: { tokenId, action, linkedContracts: existing.linkedContracts },
    }

    await notifyWithAdmins(normalized, payload)
    await notifyUsers(recipientsToNotify.filter(r => r !== normalized), payload, normalized)

    return updated
  }

  // --- Delete ---
  static async deleteDocument(tokenId: number, account: string, action: DocumentLogEntry["action"], txHash?: string) {
    const existing = await DocumentModel.getById(tokenId)
    if (!existing) return false

    const normalized = safeAddress(account)
    const success = await DocumentModel.delete(tokenId)
    if (!success) return false

    for (const c of existing.linkedContracts) {
      const log: DocumentLogEntry = {
        action,
        txHash: txHash || "",
        account: normalized,
        signer: existing.signer,
        linkedContract: c,
        timestamp: Date.now(),
      }
      await DocumentModel.addLog(tokenId, log)
    }

    const payload = {
      type: "document" as const,
      title: `Document Deleted`,
      message: `Document ${tokenId} deleted by ${normalized}`,
      txHash,
      data: { tokenId, action, linkedContracts: existing.linkedContracts },
    }

    await notifyWithAdmins(normalized, payload)
    await notifyUsers([], payload, normalized)

    return true
  }

  // --- Getters ---
  static async getAllDocuments() {
    const docs = await DocumentModel.getAll()
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })))
  }

  static async getDocumentById(tokenId: number) {
    const doc = await DocumentModel.getById(tokenId)
    if (!doc) return null
    const history = await DocumentModel.getLogs(tokenId)
    return { ...doc, history }
  }

  static async getDocumentsByOwner(owner: string) {
    const docs = await DocumentModel.getByOwner(owner)
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })))
  }

  static async getDocumentsByContract(contract: string) {
    const docs = await DocumentModel.getByContract(contract)
    return Promise.all(docs.map(async d => ({ ...d, history: await DocumentModel.getLogs(d.tokenId) })))
  }
}
