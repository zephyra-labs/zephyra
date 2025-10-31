/**
 * @file Company.ts
 * @description Type definition for Company entity
 */

/**
 * Represents a company in the system
 */
export interface Company {
  /** Unique identifier for the company */
  id: string;

  /** Official name of the company */
  name: string;

  /** Street address of the company */
  address: string;

  /** City where the company is located */
  city: string;

  /** State or province of the company */
  stateOrProvince: string;

  /** Postal code / ZIP code */
  postalCode: string;

  /** Country of the company */
  country: string;

  /** Contact email */
  email: string;

  /** Optional contact phone number */
  phone?: string;

  /** Optional tax identification number */
  taxId?: string;

  /** Optional registration number */
  registrationNumber?: string;

  /** Optional business type or industry */
  businessType?: string;

  /** Optional website URL */
  website?: string;

  /** Optional company wallet address (0x-prefixed) */
  walletAddress?: string;

  /** Whether the company is verified */
  verified: boolean;

  /** Timestamp (ms) when the company was created */
  createdAt: number;

  /** Timestamp (ms) when the company was last updated */
  updatedAt?: number;
}
