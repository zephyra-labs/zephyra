/**
 * @file ActivityDTO.ts
 * @description Data Transfer Object for ActivityLog entries.
 */

import type { ActivityLog } from '../types/Activity.js';

/**
 * DTO for activity log records
 */
export default class ActivityLogDTO {
  /** Unix timestamp in milliseconds */
  timestamp!: number;

  /** Type of activity log */
  type!: 'onChain' | 'backend';

  /** Action performed */
  action!: string;

  /** Account/wallet performing the action */
  account!: string;

  /** Optional transaction hash */
  txHash?: string;

  /** Optional contract address (required for onChain logs) */
  contractAddress?: string;

  /** Optional extra data */
  extra?: Record<string, any>;

  /** Optional on-chain info */
  onChainInfo?: {
    /** Status of the transaction */
    status: string;

    /** Block number */
    blockNumber: number;

    /** Number of confirmations */
    confirmations: number;
  };

  /**
   * Constructor
   * @param data Partial activity log data
   */
  constructor(data: Partial<ActivityLog>) {
    Object.assign(this, data);
  }

  /**
   * Validate required fields
   * @throws Error if required fields are missing
   */
  validate() {
    if (!this.timestamp) throw new Error('timestamp required');
    if (!this.type) throw new Error('type required');
    if (!this.action) throw new Error('action required');
    if (!this.account) throw new Error('account required');
    if (this.type === 'onChain' && !this.contractAddress) {
      throw new Error('contractAddress required for onChain logs');
    }
  }

  /**
   * Transform DTO into ActivityLog object
   * @returns {ActivityLog} activity log record
   */
  toJSON(): ActivityLog {
    return {
      timestamp: this.timestamp ?? Date.now(),
      type: this.type,
      action: this.action,
      account: this.account,
      txHash: this.txHash,
      contractAddress: this.contractAddress,
      extra: this.extra,
      onChainInfo: this.onChainInfo,
    };
  }
}
