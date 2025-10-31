/**
 * @file Wallet.ts
 * @description Type definitions for wallet entities and log entries.
 */

/**
 * Enum representing supported wallet actions.
 */
export enum WalletAction {
  /** User connected their wallet */
  CONNECT = 'connect',

  /** User disconnected their wallet */
  DISCONNECT = 'disconnect',

  /** User switched network */
  SWITCH_NETWORK = 'switchNetwork',

  /** User signed a message */
  SIGN_MESSAGE = 'signMessage',
}

/**
 * Represents a wallet connection or disconnection log entry.
 */
export interface WalletLog {
  /** Ethereum account or wallet address */
  account: string

  /** Type of wallet action */
  action: WalletAction

  /** Timestamp (Unix ms) of the event */
  timestamp: number

  /** Optional metadata (e.g., IP, device info, session ID) */
  meta?: Record<string, any>
}

/**
 * Represents the stored wallet state for a user.
 */
export interface WalletState {
  /** Ethereum account address */
  account: string

  /** Current connected network chain ID */
  chainId?: number

  /** Current wallet provider (e.g., Metamask, WalletConnect) */
  provider?: string

  /** Last activity timestamp */
  lastActiveAt?: number

  /** Current session ID, if applicable */
  sessionId?: string
}
