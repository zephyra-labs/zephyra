/**
 * @file Trade.ts
 * @description Types for Trade management, participants, and status tracking.
 */

/**
 * Status of a trade.
 */
export type TradeStatus = 'draft' | 'readyToTrade' | 'inProgress' | 'completed' | 'cancelled';

/**
 * Represents a participant in a trade.
 */
export interface TradeParticipant {
  /** Wallet address or unique identifier of the participant */
  address: string;

  /** Whether the participant's KYC has been verified */
  kycVerified: boolean;

  /** Whether the participant's wallet is currently connected */
  walletConnected: boolean;

  /** Role of the participant in the trade */
  role?: 'exporter' | 'importer' | 'logistics' | 'insurance' | 'inspector';
}

/**
 * Represents a trade record.
 */
export interface TradeRecord {
  /** Unique identifier for the trade */
  id: string;

  /** Optional linked contract address for on-chain trading */
  contractAddress?: string;

  /** List of participants in the trade */
  participants: TradeParticipant[];

  /** Current status of the trade */
  status: TradeStatus;

  /** Optional current stage number in the trade process */
  currentStage?: number;

  /** Timestamp when the trade was created (Unix ms) */
  createdAt: number;

  /** Timestamp when the trade was last updated (Unix ms) */
  updatedAt?: number;
}
