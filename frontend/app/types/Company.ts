export interface Company {
  id: string
  name: string
  address: string
  city: string
  stateOrProvince: string
  postalCode: string
  country: string
  email: string
  phone?: string
  taxId?: string
  registrationNumber?: string
  businessType?: string
  website?: string
  walletAddress?: string
  verified: boolean
  createdAt: number
  updatedAt?: number
}

export type CreateCompanyPayload = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'verified'>

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>
