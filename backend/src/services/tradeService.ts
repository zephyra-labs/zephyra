/**
 * @file tradeService.ts
 * @description Business logic layer for managing trade records and participants.
 * Handles creation, updates, status transitions, and participant management for trades.
 */

import { TradeModel } from "../models/tradeModel"
import type { TradeRecord, TradeParticipant, TradeStatus } from "../types/Trade"
import { notifyUsers } from "../utils/notificationHelper"
import { v4 as uuidv4 } from "uuid"

export class TradeService {
  /**
   * Creates a new trade record with one or more participants.
   *
   * @async
   * @param {TradeParticipant[]} participants - Initial list of trade participants.
   * @returns {Promise<TradeRecord>} The newly created trade record.
   * @throws {Error} If participants data is invalid or database insertion fails.
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
   * Adds a new participant to an existing trade.
   *
   * @async
   * @param {string} tradeId - The unique ID of the trade.
   * @param {TradeParticipant} participant - The participant to add.
   * @returns {Promise<TradeRecord>} The updated trade record.
   * @throws {Error} If trade is not found or participant already exists.
   */
  static async addParticipant(tradeId: string, participant: TradeParticipant): Promise<TradeRecord> {
    const trade = await TradeModel.getTradeById(tradeId)
    if (!trade) throw new Error("Trade not found")

    if (trade.participants.find(p => p.address === participant.address)) {
      throw new Error("Participant already exists")
    }

    trade.participants.push(participant)
    trade.updatedAt = Date.now()
    await TradeModel.upsertTradeRecord(trade)

    // Notify the added participant
    await notifyUsers(
      [participant.address],
      {
        type: "system",
        title: "Added to trade",
        message: `You have been added to trade ${tradeId}`,
      },
      "system"
    )

    return trade
  }

  /**
   * Assigns or updates a participant’s role within a trade.
   *
   * @async
   * @param {string} tradeId - The unique trade identifier.
   * @param {string} participantAddress - Wallet address of the participant.
   * @param {TradeParticipant['role']} role - New role to assign.
   * @returns {Promise<TradeParticipant[]>} Updated list of participants.
   * @throws {Error} If trade or participant cannot be found or updated.
   */
  static async assignRole(
    tradeId: string,
    participantAddress: string,
    role: TradeParticipant['role']
  ): Promise<TradeParticipant[]> {
    const participants = await TradeModel.updateParticipantRole(tradeId, participantAddress, role)
    return participants
  }

  /**
   * Updates the status of an existing trade.
   * Automatically notifies all participants about the status change.
   *
   * @async
   * @param {string} tradeId - The trade ID to update.
   * @param {TradeStatus} status - New trade status (e.g., "draft", "active", "completed").
   * @returns {Promise<TradeRecord>} The updated trade record with the new status.
   * @throws {Error} If trade does not exist or status update fails.
   */
  static async updateStatus(tradeId: string, status: TradeStatus): Promise<TradeRecord> {
    const trade = await TradeModel.getTradeById(tradeId)
    if (!trade) throw new Error("Trade not found")

    trade.status = status
    trade.updatedAt = Date.now()
    await TradeModel.updateTradeStatus(tradeId, status)

    // Notify all participants of the change
    const participantAddresses = trade.participants.map(p => p.address)
    if (participantAddresses.length) {
      await notifyUsers(
        participantAddresses,
        {
          type: "system",
          title: "Trade status updated",
          message: `Trade ${tradeId} status changed to ${status}`,
        },
        "system"
      )
    }

    return trade
  }

  /**
   * Retrieves all trade records in the system.
   *
   * @async
   * @returns {Promise<TradeRecord[]>} A list of all trade records.
   */
  static async getAllTrades(): Promise<TradeRecord[]> {
    return TradeModel.getAllTrades()
  }

  /**
   * Retrieves a specific trade record by its ID.
   *
   * @async
   * @param {string} id - The unique trade ID.
   * @returns {Promise<TradeRecord | null>} The trade record or null if not found.
   */
  static async getTradeById(id: string): Promise<TradeRecord | null> {
    return TradeModel.getTradeById(id)
  }

  /**
   * Retrieves all trades associated with a specific participant address.
   *
   * @async
   * @param {string} address - The participant's wallet address.
   * @returns {Promise<TradeRecord[]>} List of trades where the participant is involved.
   */
  static async getTradesByParticipant(address: string): Promise<TradeRecord[]> {
    return TradeModel.getTradesByParticipant(address)
  }
}
