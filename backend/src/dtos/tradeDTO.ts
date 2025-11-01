/**
 * @file TradeDTO.ts
 * @description DTO for TradeRecord entity including validation and transformation for storage.
 */

import type { TradeRecord, TradeParticipant, TradeStatus } from '../types/Trade.js';

/**
 * Data Transfer Object for TradeRecord.
 */
export default class TradeDTO {
  /** Unique trade ID */
  id!: string;

  /** Optional smart contract address */
  contractAddress?: string;

  /** Participants in the trade */
  participants: TradeParticipant[] = [];

  /** Current trade status */
  status!: TradeStatus;

  /** Optional current stage index */
  currentStage?: number;

  /** Timestamp of creation */
  createdAt!: number;

  /** Optional timestamp of last update */
  updatedAt?: number;

  /**
   * Constructor for TradeDTO
   * @param {Partial<TradeRecord> & { id?: string }} data Partial trade record data
   */
  constructor(data: Partial<TradeRecord> & { id?: string }) {
    Object.assign(this, data);
    if (!this.createdAt) this.createdAt = Date.now();
    if (!this.id) this.id = data.id ?? crypto.randomUUID();
  }

  /**
   * Validate required fields
   * @throws {Error} If id, participants, or status are missing or invalid
   */
  validate(): void {
    if (!this.id) throw new Error('TradeRecord id is required');
    if (!this.participants || !Array.isArray(this.participants) || this.participants.length === 0) {
      throw new Error('At least one participant is required');
    }
    if (!this.status) throw new Error('Trade status is required');
  }

  /**
   * Transform DTO into a TradeRecord ready for storage
   * @returns {TradeRecord} TradeRecord object
   */
  toTradeRecord(): TradeRecord {
    return {
      id: this.id,
      contractAddress: this.contractAddress,
      participants: this.participants.map(p => ({
        address: p.address,
        kycVerified: p.kycVerified ?? false,
        walletConnected: p.walletConnected ?? false,
        role: p.role,
      })),
      status: this.status,
      currentStage: this.currentStage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Update the updatedAt timestamp to current time
   */
  touch(): void {
    this.updatedAt = Date.now();
  }
}
