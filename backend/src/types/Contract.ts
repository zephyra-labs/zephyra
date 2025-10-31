/**
 * @file Contract.ts
 * @description Types for contract logs, state, and on-chain information.
 */

import { OnChainInfo } from './Info.js';

/**
 * Represents a single log entry for a contract
 */
export interface ContractLogEntry {
  /** Action performed on the contract */
  action: string;

  /** Transaction hash associated with this action */
  txHash: string;

  /** Ethereum account that performed the action */
  account: string;

  /** Optional exporter address */
  exporter?: string;

  /** Optional importer address */
  importer?: string;

  /** Optional logistics provider address */
  logistics?: string;

  /** Optional insurance provider address */
  insurance?: string;

  /** Optional inspector address */
  inspector?: string;

  /** Optional required amount for this stage */
  requiredAmount?: string;

  /** Optional extra metadata */
  extra?: any;

  /** Unix timestamp (ms) of the log entry */
  timestamp: number;

  /** Optional on-chain information for this action */
  onChainInfo?: OnChainInfo;
}

/**
 * Represents the current state of a contract
 */
export interface ContractState {
  /** Optional exporter address */
  exporter?: string;

  /** Optional importer address */
  importer?: string;

  /** Optional logistics provider address */
  logistics?: string;

  /** Optional insurance provider address */
  insurance?: string;

  /** Optional inspector address */
  inspector?: string;

  /** Optional status of the contract */
  status?: string;

  /** Optional current stage of the contract */
  currentStage?: string;

  /** Unix timestamp (ms) when the state was last updated */
  lastUpdated: number;
}

/**
 * Aggregated contract logs and current state
 */
export interface ContractLogs {
  /** Contract address (0x-prefixed) */
  contractAddress: string;

  /** Current state of the contract */
  state: ContractState;

  /** Historical log entries */
  history: ContractLogEntry[];
}
