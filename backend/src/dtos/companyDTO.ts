import type { Company } from '../types/Company.js';

export default class CompanyDTO {
  id?: string;
  name!: string;
  address!: string;
  city!: string;
  stateOrProvince!: string;
  postalCode!: string;
  country!: string;
  email!: string;
  phone?: string;
  taxId?: string;
  registrationNumber?: string;
  businessType?: string;
  website?: string;
  walletAddress?: string;
  verified: boolean = false;
  createdAt?: number;
  updatedAt?: number;

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

  validate() {
    if (!this.name) throw new Error('name required');
    if (!this.address) throw new Error('address required');
    if (!this.city) throw new Error('city required');
    if (!this.stateOrProvince) throw new Error('stateOrProvince required');
    if (!this.postalCode) throw new Error('postalCode required');
    if (!this.country) throw new Error('country required');
    if (!this.email) throw new Error('email required');
  }

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
