/**
 * @file walletDTO.ts
 * @description DTOs for wallet requests and validation.
 */

import { WalletAction, WalletLog, WalletState } from '../types/Wallet.js';

/**
 * Data Transfer Object for creating a new wallet log entry.
 */
export class CreateWalletLogDTO {
  /** Ethereum account or wallet address */
  account!: string;

  /** Type of wallet action */
  action!: WalletAction;

  /** Optional metadata (e.g., IP, device info) */
  meta: Record<string, any>;

  /**
   * @param {Partial<CreateWalletLogDTO>} data Partial data to initialize DTO
   */
  constructor(data: Partial<CreateWalletLogDTO>) {
    Object.assign(this, data);
    this.meta = data.meta || {};
  }

  /**
   * Validates the payload structure and types.
   * @throws {Error} If validation fails
   */
  validate(): void {
    if (!this.account || typeof this.account !== 'string') {
      throw new Error('Invalid or missing "account"');
    }

    if (!Object.values(WalletAction).includes(this.action)) {
      throw new Error(`Invalid "action": ${this.action}`);
    }
  }

  /**
   * Converts the DTO into a wallet log object.
   * @returns {WalletLog} A valid wallet log entry.
   */
  toLog(): WalletLog {
    return {
      account: this.account,
      action: this.action,
      timestamp: Date.now(),
      meta: this.meta,
    };
  }
}

/**
 * Data Transfer Object for updating or merging wallet state.
 */
export class UpdateWalletStateDTO {
  /** Ethereum account address */
  account!: string;

  /** Network chain ID */
  chainId?: number;

  /** Wallet provider name */
  provider?: string;

  /** Current session ID */
  sessionId?: string;

  constructor(data: Partial<UpdateWalletStateDTO>) {
    Object.assign(this, data);
  }

  /**
   * Validates the payload for wallet state update.
   * @throws {Error} If validation fails
   */
  validate(): void {
    if (!this.account || typeof this.account !== 'string') {
      throw new Error('Invalid or missing "account"');
    }
  }

  /**
   * Converts this DTO to a WalletState object.
   * @returns {WalletState} A normalized wallet state.
   */
  toState(): WalletState {
    return {
      account: this.account,
      chainId: this.chainId,
      provider: this.provider,
      lastActiveAt: Date.now(),
      sessionId: this.sessionId,
    };
  }
}
