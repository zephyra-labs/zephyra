/**
 * @file KYC.ts
 * @description Types and interfaces for KYC (Know Your Customer) records and logs.
 */

import { OnChainInfo } from './Info.js';

/**
 * Allowed KYC statuses
 */
export type KYCStatus = 'Draft' | 'Reviewed' | 'Signed' | 'Revoked';

/**
 * Represents a KYC document or record
 */
export interface KYC {
  /** Unique identifier for the KYC token */
  tokenId: string;

  /** Owner wallet address */
  owner: string;

  /** IPFS or file hash of the KYC document */
  fileHash: string;

  /** URL to metadata JSON */
  metadataUrl: string;

  /** Optional URL to the document */
  documentUrl?: string;

  /** Optional KYC name/title */
  name?: string;

  /** Optional description of the KYC */
  description?: string;

  /** Optional blockchain transaction hash */
  txHash?: string;

  /** Creation timestamp (Unix ms) */
  createdAt: number;

  /** Last update timestamp (Unix ms) */
  updatedAt?: number;

  /** Current status of the KYC */
  status: KYCStatus;

  // --- Internal processing fields ---
  /** Address of the reviewer */
  reviewedBy?: string;

  /** Signature of approval */
  signature?: string;

  /** Internal remarks or notes */
  remarks?: string;
}

/**
 * Log entry for KYC actions
 */
export interface KYCLogEntry {
  /** Action performed */
  action: 'mintKYC' | 'reviewKYC' | 'signKYC' | 'revokeKYC' | 'deleteKYC' | 'internal_update';

  /** Transaction hash associated with this action */
  txHash: string;

  /** Account that performed the action */
  account: string;

  /** Optional executor account */
  executor?: string;

  /** Optional additional metadata */
  extra?: any;

  /** Timestamp of the action (Unix ms) */
  timestamp: number;

  /** Optional on-chain information */
  onChainInfo?: OnChainInfo;

  /** Optional detailed info about the action */
  details?: {
    status?: string;
    reviewedBy?: string;
    signature?: string;
  };
}

/**
 * KYC logs container
 */
export interface KYCLogs {
  /** Token ID associated with the logs */
  tokenId: number;

  /** History of all log entries */
  history: KYCLogEntry[];
}
