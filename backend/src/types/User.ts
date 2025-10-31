/**
 * @file User.ts
 * @description Types for User management, roles, and metadata.
 */

/**
 * Roles a user can have.
 */
export type UserRole = 'admin' | 'user';

/**
 * Metadata associated with a user.
 */
export interface UserMetadata {
  /** Full name of the user */
  name?: string;

  /** Email address */
  email?: string;

  /** KYC verification status */
  kycStatus?: 'pending' | 'approved' | 'rejected';

  /** Additional arbitrary metadata */
  [key: string]: any;
}

/**
 * Represents a user in the system.
 */
export interface User {
  /** Wallet address or unique user identifier */
  address: string;

  /** Role of the user */
  role: UserRole;

  /** Timestamp when the user was created (Unix ms) */
  createdAt: number;

  /** Timestamp of last login (Unix ms) */
  lastLoginAt: number;

  /** Optional additional metadata */
  metadata?: UserMetadata;
}

/**
 * Payload for creating a new user.
 */
export interface CreateUserDTO {
  /** Wallet address or unique identifier of the user */
  address: string;

  /** Optional role, defaults to 'user' if not provided */
  role?: UserRole;

  /** Optional metadata for the user */
  metadata?: UserMetadata;
}

/**
 * Payload for updating an existing user.
 */
export interface UpdateUserDTO {
  /** Optional updated role */
  role?: UserRole;

  /** Optional partial metadata to update */
  metadata?: Partial<UserMetadata>;

  /** Optional timestamp for last login update (Unix ms) */
  lastLoginAt?: number;
}
