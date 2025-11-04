/**
 * @file Activity.ts
 * @description Type definitions for ActivityLog entries
 */

/**
 * Represents an activity record in the system, either on-chain or backend.
 *
 * @template TExtra - Type of optional extra metadata (default: Record<string, unknown>)
 */
export interface ActivityLog<TExtra = Record<string, unknown>> {
  /** Timestamp (ms) when the activity occurred */
  timestamp: number;

  /** Type of activity: on-chain or backend */
  type: 'onChain' | 'backend';

  /** Action performed (e.g., "mintKYC", "updateContract") */
  action: string;

  /** Wallet/account that performed the action */
  account: string;

  /** Optional transaction hash for blockchain actions */
  txHash?: string;

  /** Optional related contract address (0x-prefixed) */
  contractAddress?: string;

  /** Optional additional metadata */
  extra?: TExtra;

  /** Optional on-chain information if activity is recorded on blockchain */
  onChainInfo?: {
    /** Status of the transaction */
    status: string;

    /** Block number where the transaction was included */
    blockNumber: number;

    /** Number of confirmations */
    confirmations: number;
  };
}
