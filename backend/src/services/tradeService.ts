import { TradeModel } from "../models/tradeModel.js"
import type { TradeRecord, TradeParticipant, TradeStatus } from "../types/Trade.js"
import { notifyUsers } from "../utils/notificationHelper.js"
import { v4 as uuidv4 } from "uuid"

export class TradeService {
  /**
   * Buat trade baru
   */
  static async createTrade(participants: TradeParticipant[]): Promise<TradeRecord> {
    const id = uuidv4()
    const record: TradeRecord = {
      id,
      participants,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await TradeModel.upsertTradeRecord(record)
    return record
  }

  /**
   * Tambah participant ke trade
   */
  static async addParticipant(tradeId: string, participant: TradeParticipant) {
    const trade = await TradeModel.getTradeById(tradeId)
    if (!trade) throw new Error("Trade not found")

    if (trade.participants.find(p => p.address === participant.address)) {
      throw new Error("Participant already exists")
    }

    trade.participants.push(participant)
    trade.updatedAt = Date.now()
    await TradeModel.upsertTradeRecord(trade)

    // Notifikasi
    await notifyUsers([participant.address], {
      type: "system",
      title: "Added to trade",
      message: `You have been added to trade ${tradeId}`,
    }, "system")

    return trade
  }

  /**
   * Assign role participant
   */
  static async assignRole(tradeId: string, participantAddress: string, role: TradeParticipant['role']) {
    const participants = await TradeModel.updateParticipantRole(tradeId, participantAddress, role)
    return participants
  }

  /**
   * Update status trade
   */
  static async updateStatus(tradeId: string, status: TradeStatus) {
    const trade = await TradeModel.getTradeById(tradeId)
    if (!trade) throw new Error("Trade not found")

    // Validasi status jika perlu
    trade.status = status
    trade.updatedAt = Date.now()
    await TradeModel.updateTradeStatus(tradeId, status)

    // Notifikasi ke semua participants
    const participantAddresses = trade.participants.map(p => p.address)
    if (participantAddresses.length) {
      await notifyUsers(participantAddresses, {
        type: "system",
        title: `Trade status updated`,
        message: `Trade ${tradeId} status changed to ${status}`,
      }, "system")
    }

    return trade
  }

  /**
   * Ambil semua trade
   */
  static async getAllTrades() {
    return TradeModel.getAllTrades()
  }

  /**
   * Ambil trade by ID
   */
  static async getTradeById(id: string) {
    return TradeModel.getTradeById(id)
  }

  /**
   * Ambil semua trade untuk participant tertentu
   */
  static async getTradesByParticipant(address: string) {
    return TradeModel.getTradesByParticipant(address)
  }
}
