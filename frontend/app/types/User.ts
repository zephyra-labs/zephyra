export type UserRole = 'admin' | 'user'

export type KYCStatus = 'pending' | 'approved' | 'rejected'

export interface UserMetadata {
  name?: string
  email?: string
  kycStatus?: KYCStatus
  [key: string]: unknown
}

export interface User {
  address: string
  role: UserRole
  createdAt: number
  lastLoginAt: number
  metadata?: UserMetadata
}

export interface CreateUserDTO {
  address: string
  role?: UserRole
  metadata?: UserMetadata
}

export interface UpdateUserDTO {
  role?: UserRole
  metadata?: Partial<UserMetadata>
  lastLoginAt?: number
}
