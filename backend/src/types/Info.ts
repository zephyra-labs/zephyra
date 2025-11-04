/**
 * @file Info.ts
 * @description On-chain blockchain information for KYC or contract actions.
 */

/**
 * Represents blockchain transaction or contract execution info
 */
export interface OnChainInfo {
  /** Status of the transaction (string or numeric code) */
  status: string | number;

  /** Optional block number in which the transaction was included */
  blockNumber?: number;

  /** Optional number of confirmations for the transaction */
  confirmations?: number;
}
