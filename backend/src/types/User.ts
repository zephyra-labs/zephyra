export type UserRole = 'admin' | 'user'

export interface User {
  address: string
  role: UserRole
  createdAt: number
  lastLoginAt: number
  metadata?: UserMetadata
}

export interface UserMetadata {
  name?: string
  email?: string
  kycStatus?: 'pending' | 'approved' | 'rejected'
  [key: string]: any
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
