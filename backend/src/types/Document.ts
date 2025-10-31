/**
 * @file Document.ts
 * @description Types and interfaces for document management, logs, and blockchain info.
 */

import { OnChainInfo } from './Info.js';

/**
 * Supported document types
 */
export type DocType = "Invoice" | "B/L" | "COO" | "PackingList" | "Other";

/**
 * Lifecycle status of a document
 */
export type DocumentStatus = "Draft" | "Reviewed" | "Signed" | "Revoked";

/**
 * Represents a trade-related document stored in the system
 */
export interface Document {
  /** Unique token ID for the document */
  tokenId: number;

  /** Ethereum account or wallet address of the document owner */
  owner: string;

  /** Hash of the file content */
  fileHash: string;

  /** URI or metadata link to the document */
  uri: string;

  /** Type of document */
  docType: DocType;

  /** Linked smart contract addresses */
  linkedContracts: string[];

  /** Current status of the document */
  status: DocumentStatus;

  /** Timestamp when document was created (Unix ms) */
  createdAt: number;

  /** Timestamp when document was last updated (optional) */
  updatedAt?: number;

  /** Signer of the document (if signed) */
  signer?: string;

  /** Optional document name */
  name?: string;

  /** Optional description */
  description?: string;

  /** Optional metadata URL */
  metadataUrl?: string;
}

/**
 * Represents a single log entry for a document's lifecycle event
 */
export interface DocumentLogEntry {
  /** Action performed on the document */
  action:
    | 'mintDocument'
    | 'reviewDocument'
    | 'signDocument'
    | 'revokeDocument'
    | 'linkDocument';

  /** Transaction hash on blockchain, if applicable */
  txHash: string;

  /** Account that performed the action */
  account: string;

  /** Signer of the document for sign actions (optional) */
  signer?: string;

  /** Related contract for linkDocument action (optional) */
  linkedContract?: string;

  /** Extra metadata for the log entry */
  extra?: any;

  /** Timestamp of the action (Unix ms) */
  timestamp: number;

  /** Optional blockchain info for this action */
  onChainInfo?: OnChainInfo;
}

/**
 * Collection of logs for a specific document
 */
export interface DocumentLogs {
  /** Token ID of the document */
  tokenId: number;

  /** Related contract address */
  contractAddress: string;

  /** History of log entries */
  history: DocumentLogEntry[];
}
