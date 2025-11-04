/**
 * @file Dashboard.ts
 * @description Types for dashboard statistics, recent activity, and wallet info.
 */

/**
 * Represents a wallet summary for the dashboard
 */
export interface DashboardWallet {
  /** Ethereum address (0x-prefixed) */
  address: `0x${string}`;

  /** Current balance (in smallest unit or main currency) */
  balance: number;
}

/**
 * Represents a smart contract summary for the dashboard
 */
export interface DashboardContract {
  /** Contract address (0x-prefixed) */
  address: `0x${string}`;

  /** Optional owner address */
  owner?: `0x${string}`;

  /** ISO string of contract creation timestamp */
  createdAt: string;

  /** Optional last action performed on this contract */
  lastAction?: {
    /** Action name */
    action: string;

    /** Ethereum account that performed the action */
    account?: string;

    /** Unix timestamp (ms) of the action */
    timestamp: number;
  } | null;
}

/**
 * Represents a document summary for the dashboard
 */
export interface DashboardDocument {
  /** Unique document ID */
  id: string;

  /** Optional token ID if on-chain */
  tokenId?: number;

  /** Document owner address */
  owner: string;

  /** Optional document title */
  title?: string;

  /** Optional document type */
  docType?: string;

  /** Optional status of the document */
  status?: string;

  /** Optional creation timestamp */
  createdAt?: number;

  /** Optional last update timestamp */
  updatedAt?: number;

  /** Optional last action performed on the document */
  lastAction?: {
    /** Action name */
    action: string;

    /** Account that performed the action */
    account?: string;

    /** Unix timestamp (ms) of the action */
    timestamp: number;
  } | null;
}

/**
 * Summary statistics for dashboard
 */
export interface DashboardStats {
  /** Total number of deployed contracts */
  totalContracts: number;

  /** Total number of documents */
  totalDocuments: number;

  /** Total number of wallets */
  totalWallets: number;
}

/**
 * Aggregated dashboard data including recent activity and wallets
 */
export interface DashboardData extends DashboardStats {
  /** List of recent contracts */
  recentContracts: DashboardContract[];

  /** List of recent documents */
  recentDocuments: DashboardDocument[];

  /** List of wallets and balances */
  wallets: DashboardWallet[];
}
