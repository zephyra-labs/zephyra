/**
 * @file companyDTO.ts
 * @description Data Transfer Object for Company entity.
 */

import type { Company } from '../types/Company';

/**
 * DTO for company data
 */
export default class CompanyDTO {
  /** Unique ID (optional for new records) */
  id?: string;

  /** Company name */
  name!: string;

  /** Street address */
  address!: string;

  /** City */
  city!: string;

  /** State or province */
  stateOrProvince!: string;

  /** Postal code */
  postalCode!: string;

  /** Country */
  country!: string;

  /** Email */
  email!: string;

  /** Optional phone number */
  phone?: string;

  /** Optional tax ID */
  taxId?: string;

  /** Optional registration number */
  registrationNumber?: string;

  /** Optional business type */
  businessType?: string;

  /** Optional website URL */
  website?: string;

  /** Optional wallet address */
  walletAddress?: string;

  /** Verified status */
  verified: boolean = false;

  /** Creation timestamp */
  createdAt?: number;

  /** Last update timestamp */
  updatedAt?: number;

  /**
   * Constructor for CompanyDTO
   * @param data Partial company data with required fields for new company
   */
  constructor(
    data: Partial<Company> & { 
      name: string; 
      address: string; 
      city: string; 
      stateOrProvince: string; 
      postalCode: string; 
      country: string 
    }
  ) {
    Object.assign(this, data);
    if (data.verified !== undefined) this.verified = data.verified;
  }

  /**
   * Validate required fields
   */
  validate() {
    if (!this.name) throw new Error('name required');
    if (!this.address) throw new Error('address required');
    if (!this.city) throw new Error('city required');
    if (!this.stateOrProvince) throw new Error('stateOrProvince required');
    if (!this.postalCode) throw new Error('postalCode required');
    if (!this.country) throw new Error('country required');
    if (!this.email) throw new Error('email required');
  }

  /**
   * Transform DTO into a JSON object suitable for Firestore or API response
   * @returns {Omit<Company, 'id'>} Company object without ID
   */
  toJSON(): Omit<Company, 'id'> {
    return {
      name: this.name,
      address: this.address,
      city: this.city,
      stateOrProvince: this.stateOrProvince,
      postalCode: this.postalCode,
      country: this.country,
      email: this.email,
      phone: this.phone,
      taxId: this.taxId,
      registrationNumber: this.registrationNumber,
      businessType: this.businessType,
      website: this.website,
      walletAddress: this.walletAddress,
      verified: this.verified,
      createdAt: this.createdAt ?? Date.now(),
      updatedAt: this.updatedAt,
    };
  }
}
