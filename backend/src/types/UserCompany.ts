/**
 * @file UserCompany.ts
 * @description Types for User-Company relationships and roles.
 */

/**
 * Roles a user can have within a company.
 */
export type UserCompanyRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

/**
 * Status of a user's membership in a company.
 */
export type UserCompanyStatus = 'active' | 'pending' | 'rejected';

/**
 * Represents a user's membership in a company.
 */
export interface UserCompany {
  /** Unique ID of the record */
  id: string;

  /** Wallet address of the user */
  userAddress: string;

  /** Company ID */
  companyId: string;

  /** Role of the user in the company */
  role: UserCompanyRole;

  /** Status of the user's membership */
  status: UserCompanyStatus;

  /** Timestamp when user joined the company (Unix ms) */
  joinedAt: number;

  /** Optional: last update timestamp (Unix ms) */
  updatedAt?: number;

  /** Optional: transaction hash for on-chain membership */
  txHash?: string;

  /** Optional: timestamp when user joined on-chain */
  onchainJoinedAt?: number;
}

/**
 * Payload for creating a new UserCompany record.
 */
export interface CreateUserCompanyDTO {
  /** Wallet address of the user */
  userAddress: string;

  /** Company ID */
  companyId: string;

  /** Role of the user in the company (optional, default can be 'viewer') */
  role?: UserCompanyRole;

  /** Status of the membership (optional, default can be 'pending') */
  status?: UserCompanyStatus;

  /** Optional: transaction hash for on-chain record */
  txHash?: string;

  /** Timestamp when user joined (Unix ms) */
  joinedAt: number;

  /** Optional: on-chain joined timestamp */
  onchainJoinedAt?: number;
}

/**
 * Payload for updating an existing UserCompany record.
 */
export interface UpdateUserCompanyDTO {
  /** Updated role */
  role?: UserCompanyRole;

  /** Updated status */
  status?: UserCompanyStatus;

  /** Optional: transaction hash for on-chain update */
  txHash?: string;

  /** Optional: on-chain joined timestamp */
  onchainJoinedAt?: number;

  /** Optional: last updated timestamp (Unix ms) */
  updatedAt?: number;
}

/**
 * Represents a user with their associated companies.
 */
export interface UserWithCompanies {
  /** Wallet address of the user */
  userAddress: string;

  /** List of companies the user belongs to */
  companies: {
    /** Company ID */
    companyId: string;

    /** Role in the company */
    role: UserCompanyRole;

    /** Membership status */
    status: UserCompanyStatus;
  }[];
}

/**
 * Represents a company with its associated users.
 */
export interface CompanyWithUsers {
  /** Company ID */
  companyId: string;

  /** List of users belonging to the company */
  users: {
    /** Wallet address of the user */
    userAddress: string;

    /** Role in the company */
    role: UserCompanyRole;

    /** Membership status */
    status: UserCompanyStatus;
  }[];
}
