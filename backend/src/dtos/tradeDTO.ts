/**
 * @file tradeDTO.ts
 * @description DTO for TradeRecord entity including validation and transformation for storage.
 */

import type { TradeRecord, TradeParticipant, TradeStatus } from '../types/Trade';

/**
 * Data Transfer Object for TradeRecord.
 */
export default class TradeDTO {
  /** Unique trade ID */
  id: string;

  /** Optional smart contract address */
  contractAddress?: string;

  /** Participants in the trade */
  participants: TradeParticipant[];

  /** Current trade status */
  status: TradeStatus;

  /** Optional current stage index */
  currentStage?: number;

  /** Timestamp of creation */
  createdAt: number;

  /** Optional timestamp of last update */
  updatedAt?: number;

  /**
   * Constructor for TradeDTO
   * @param data Partial trade record data, may include id
   */
  constructor(data: Partial<TradeRecord> & { id?: string } = {}) {
    this.id = data.id ?? crypto.randomUUID();
    this.contractAddress = data.contractAddress;
    this.participants = data.participants ?? [];
    this.status = data.status!;
    this.currentStage = data.currentStage;
    this.createdAt = data.createdAt ?? Date.now();
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate required fields
   */
  validate(): void {
    if (!this.id) throw new Error('TradeRecord id is required');
    if (!Array.isArray(this.participants) || this.participants.length === 0) {
      throw new Error('At least one participant is required');
    }
    if (!this.status) throw new Error('Trade status is required');
  }

  /**
   * Transform DTO into a TradeRecord ready for storage
   */
  toTradeRecord(): TradeRecord {
    this.validate(); // pastikan semua required fields valid
    return {
      id: this.id,
      contractAddress: this.contractAddress,
      participants: this.participants.map(p => ({
        address: p.address,
        role: p.role,
        kycVerified: p.kycVerified ?? false,
        walletConnected: p.walletConnected ?? false,
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
