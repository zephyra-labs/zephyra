/**
 * @file UserDTO.ts
 * @description DTOs for User entity including create, update, and Firestore conversion.
 */

import type { User, UserMetadata, UserRole } from "../types/User";

/**
 * Data Transfer Object for User.
 */
export default class UserDTO {
  /** Wallet address */
  address: string;

  /** User role */
  role: UserRole;

  /** Timestamp of user creation */
  createdAt: number;

  /** Timestamp of last login */
  lastLoginAt: number;

  /** Optional metadata */
  metadata?: UserMetadata;

  /**
   * Constructor for UserDTO
   * @param {Partial<User>} data Partial user object
   * @throws {Error} If address is missing
   */
  constructor(data: Partial<User>) {
    if (!data.address) throw new Error("address is required");

    this.address = data.address;
    this.role = data.role || "user";
    this.createdAt = data.createdAt || Date.now();
    this.lastLoginAt = data.lastLoginAt || Date.now();
    this.metadata = data.metadata || {};
  }

  /**
   * Convert DTO to Firestore-compatible object
   * @returns {User} User object ready for Firestore
   */
  toFirestore(): User {
    return {
      address: this.address,
      role: this.role,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      metadata: this.metadata,
    };
  }
}

/**
 * DTO for creating a new User.
 */
export class CreateUserDTO {
  /** Wallet address */
  address: string;

  /** Optional user role */
  role?: UserRole;

  /** Optional metadata */
  metadata?: UserMetadata;

  /**
   * Constructor for CreateUserDTO
   * @param {Partial<User> & { address: string }} data Partial user with required address
   * @throws {Error} If address is missing
   */
  constructor(data: Partial<User> & { address: string }) {
    if (!data.address) throw new Error("Address is required");
    this.address = data.address;
    this.role = data.role ?? "user";
    this.metadata = data.metadata ?? {
      name: "-",
      email: "-",
      kycStatus: "pending",
    };
  }

  /**
   * Convert DTO to Firestore-compatible object
   * @returns {User} User object ready for Firestore
   */
  toFirestore(): User {
    return {
      address: this.address,
      role: this.role!,
      metadata: this.metadata!,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
  }
}

/**
 * DTO for updating an existing User.
 */
export class UpdateUserDTO {
  /** Optional updated role */
  role?: UserRole;

  /** Optional updated metadata */
  metadata?: Partial<UserMetadata>;

  /** Optional updated last login timestamp */
  lastLoginAt?: number;

  /** Optional updated KYC status */
  kycStatus?: "pending" | "approved" | "rejected";

  /**
   * Constructor for UpdateUserDTO
   * @param {Partial<User> & { kycStatus?: "pending" | "approved" | "rejected" }} data Partial user update
   */
  constructor(data: Partial<User> & { kycStatus?: "pending" | "approved" | "rejected" }) {
    this.role = data.role;
    this.metadata = data.metadata;
    this.lastLoginAt = data.lastLoginAt;
    this.kycStatus = data.kycStatus;
  }
}
