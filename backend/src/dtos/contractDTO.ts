/**
 * @file ContractLogDTO.ts
 * @description DTO for contract log entries and partial contract state management.
 */

import type { ContractLogEntry, ContractState, ContractLogExtra } from '../types/Contract.js';
import type { OnChainInfo } from '../types/Info.js';

/**
 * Data Transfer Object for a contract log entry
 */
export default class ContractLogDTO {
  /** Contract address */
  contractAddress!: string;

  /** Action performed */
  action!: string;

  /** Transaction hash */
  txHash!: string;

  /** Account performing the action */
  account!: string;

  /** Optional participants in the contract */
  exporter?: string;
  importer?: string;
  logistics?: string[];
  insurance?: string;
  inspector?: string;

  /** Optional required amount for contract action */
  requiredAmount?: string;

  /** Optional status of the contract */
  status?: string;

  /** Optional current stage */
  currentStage?: string;

  /** Optional extra data */
  extra?: ContractLogExtra;

  /** Timestamp of the log */
  timestamp!: number;

  /** Optional on-chain information */
  onChainInfo?: OnChainInfo;

  // --- Optional for controller/service usage ---
  /** Flag to indicate on-chain verification */
  verifyOnChain?: boolean;

  /** Partial contract state */
  state?: Partial<ContractState>;

  /**
   * Constructor for ContractLogDTO
   * @param data Partial contract log entry data
   */
  constructor(
    data: Partial<ContractLogEntry> & {
      contractAddress: string;
      verifyOnChain?: boolean;
      state?: Partial<ContractState>;
      status?: string;
      currentStage?: string;
    },
  ) {
    Object.assign(this, data);
  }

  /**
   * Validate required fields
   */
  validate() {
    if (!this.contractAddress) throw new Error('contractAddress required');
    if (!this.action) throw new Error('action required');
    if (!this.txHash) throw new Error('txHash required');
    if (!this.account) throw new Error('account required');
  }

  /**
   * Transform DTO into a ContractLogEntry object for Firestore or processing
   * @returns {ContractLogEntry} Contract log entry object
   */
  toLogEntry(): ContractLogEntry {
    return {
      action: this.action,
      txHash: this.txHash,
      account: this.account,
      exporter: this.exporter,
      importer: this.importer,
      logistics: this.logistics ?? [],
      insurance: this.insurance,
      inspector: this.inspector,
      requiredAmount: this.requiredAmount,
      extra: this.extra,
      timestamp: this.timestamp ?? Date.now(),
      onChainInfo: this.onChainInfo,
    };
  }

  /**
   * Transform DTO into a partial ContractState
   * @returns {Partial<ContractState>} Partial contract state
   */
  toState(): Partial<ContractState> {
    return {
      exporter: this.exporter,
      importer: this.importer,
      logistics: this.logistics ?? [],
      insurance: this.insurance,
      inspector: this.inspector,
      status: this.status ?? this.state?.status,
      currentStage: this.currentStage ?? this.state?.currentStage,
      lastUpdated: Date.now(),
    };
  }
}
