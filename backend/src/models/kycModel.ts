import type { KYC, KYCLogs, KYCLogEntry } from "../types/Kyc.js"
import { db } from "../config/firebase.js"

const collection = db.collection("KYCs")
const logsCollection = db.collection("KYCLogs")

export class KYCModel {
  static async create(data: KYC): Promise<KYC> {
    const docRef = collection.doc(data.tokenId)
    await docRef.set(data)
    return data
  }

  static async update(tokenId: string, data: Partial<KYC>): Promise<KYC | null> {
    const docRef = collection.doc(tokenId)
    const doc = await docRef.get()
    if (!doc.exists) return null

    const updated = { ...doc.data(), ...data } as KYC
    await docRef.update(updated as FirebaseFirestore.DocumentData)
    return updated
  }

  static async delete(tokenId: string): Promise<KYC | null> {
    const docRef = collection.doc(tokenId)
    const doc = await docRef.get()
    if (!doc.exists) return null

    const data = doc.data() as KYC
    await docRef.delete()
    return data
  }

  static async getAll(): Promise<KYC[]> {
    const snapshot = await collection.get()
    return snapshot.docs.map(doc => doc.data() as KYC)
  }

  static async getById(tokenId: string): Promise<KYC | null> {
    const doc = await collection.doc(tokenId).get()
    return doc.exists ? (doc.data() as KYC) : null
  }

  static async getByOwner(owner: string): Promise<KYC[]> {
    const snapshot = await collection.where("owner", "==", owner).get()
    return snapshot.docs.map(doc => doc.data() as KYC)
  }

  // Logs
  static async addLog(tokenId: string, entry: KYCLogEntry) {
    const ref = logsCollection.doc(tokenId)
    const snap = await ref.get()
    if (!snap.exists) {
      const newLog: KYCLogs = { tokenId: Number(tokenId), history: [entry] }
      await ref.set(newLog)
    } else {
      const current = snap.data() as KYCLogs
      current.history.push(entry)
      await ref.update(current as FirebaseFirestore.DocumentData)
    }
  }

  static async getLogs(tokenId: string): Promise<KYCLogEntry[]> {
    const doc = await logsCollection.doc(tokenId).get()
    if (!doc.exists) return []
    return (doc.data() as KYCLogs).history
  }
}
