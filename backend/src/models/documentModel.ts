import { db } from "../config/firebase.js"
import type { Document, DocumentLogs, DocumentLogEntry } from "../types/Document.js"

const collection = db.collection("documents")
const logsCollection = db.collection("documentLogs")

export class DocumentModel {
  // --- Create ---
  static async create(doc: Document): Promise<Document> {
    const ref = collection.doc(doc.tokenId.toString())
    const snap = await ref.get()
    if (snap.exists) throw new Error(`Document ${doc.tokenId} already exists`)
    await ref.set(doc)
    return doc
  }

  // --- Update ---
  static async update(tokenId: number, data: Partial<Document>): Promise<Document | null> {
    const ref = collection.doc(tokenId.toString())
    const snap = await ref.get()
    if (!snap.exists) return null

    const existing = snap.data() as Document
    const updated: Document = { ...existing, ...data, updatedAt: Date.now() }
    await ref.update(updated as any)
    return updated
  }

  // --- Delete ---
  static async delete(tokenId: number): Promise<boolean> {
    const ref = collection.doc(tokenId.toString())
    const snap = await ref.get()
    if (!snap.exists) return false
    await ref.delete()
    return true
  }

  // --- Get single ---
  static async getById(tokenId: number): Promise<Document | null> {
    const snap = await collection.doc(tokenId.toString()).get()
    return snap.exists ? (snap.data() as Document) : null
  }

  // --- Get all ---
  static async getAll(): Promise<Document[]> {
    const snap = await collection.get()
    return snap.docs.map(d => d.data() as Document)
  }

  // --- Get by owner ---
  static async getByOwner(owner: string): Promise<Document[]> {
    const snap = await collection.where("owner", "==", owner).get()
    return snap.docs.map(d => d.data() as Document)
  }

  // --- Get by contract ---
  static async getByContract(contractAddress: string): Promise<Document[]> {
    const snap = await collection.where("linkedContracts", "array-contains", contractAddress).get()
    return snap.docs.map(d => d.data() as Document)
  }

  // --- Logs ---
  static async addLog(tokenId: number, log: DocumentLogEntry) {
    const logRef = logsCollection.doc(tokenId.toString())
    const snap = await logRef.get()

    if (!snap.exists) {
      const newLog: DocumentLogs = { tokenId, contractAddress: log.linkedContract || "", history: [log] }
      await logRef.set(newLog)
    } else {
      const existing = snap.data() as DocumentLogs
      existing.history.push(log)
      await logRef.update(existing as any)
    }
  }

  static async getLogs(tokenId: number): Promise<DocumentLogEntry[]> {
    const snap = await logsCollection.doc(tokenId.toString()).get()
    return snap.exists ? (snap.data() as DocumentLogs).history : []
  }
}
