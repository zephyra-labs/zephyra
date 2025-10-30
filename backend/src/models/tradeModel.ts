import { db } from "../config/firebase.js"
import type { TradeRecord, TradeParticipant, TradeStatus } from "../types/Trade.js"

const collection = db.collection("tradeRecords")

export class TradeModel {
  // --- Tambah atau update trade record ---
  static async upsertTradeRecord(record: TradeRecord) {
    const docRef = collection.doc(record.id)
    const doc = await docRef.get()

    if (doc.exists) {
      await docRef.update({
        ...record,
        updatedAt: Date.now(),
      })
    } else {
      await docRef.set({
        ...record,
        createdAt: Date.now(),
        updatedAt: record.updatedAt ?? null,
      })
    }
  }

  // --- Ambil semua trade records ---
  static async getAllTrades(): Promise<TradeRecord[]> {
    const snapshot = await collection.get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TradeRecord))
  }

  // --- Ambil trade record by ID ---
  static async getTradeById(id: string): Promise<TradeRecord | null> {
    const doc = await collection.doc(id).get()
    return doc.exists ? (doc.data() as TradeRecord) : null
  }

  // --- Ambil trade records by participant address ---
  static async getTradesByParticipant(address: string): Promise<TradeRecord[]> {
    const snapshot = await collection.where("participants", "array-contains", { address }).get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TradeRecord))
  }

  // --- Update participant role ---
  static async updateParticipantRole(tradeId: string, participantAddress: string, role: TradeParticipant['role']) {
    const docRef = collection.doc(tradeId)
    const doc = await docRef.get()
    if (!doc.exists) throw new Error("TradeRecord not found")

    const record = doc.data() as TradeRecord
    const participants = record.participants.map(p =>
      p.address === participantAddress ? { ...p, role } : p
    )

    await docRef.update({
      participants,
      updatedAt: Date.now(),
    })

    return participants
  }

  // --- Update trade status ---
  static async updateTradeStatus(tradeId: string, status: TradeStatus) {
    const docRef = collection.doc(tradeId)
    const doc = await docRef.get()
    if (!doc.exists) throw new Error("TradeRecord not found")

    await docRef.update({
      status,
      updatedAt: Date.now(),
    })
  }
}
