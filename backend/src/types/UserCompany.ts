export type UserCompanyRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer'
export type UserCompanyStatus = 'active' | 'pending' | 'rejected'

export interface UserCompany {
  id: string
  userAddress: string
  companyId: string
  role: UserCompanyRole
  status: UserCompanyStatus
  joinedAt: number
  updatedAt?: number
  txHash?: string
  onchainJoinedAt?: number
}

export interface CreateUserCompanyDTO {
  userAddress: string
  companyId: string
  role?: UserCompanyRole
  status?: UserCompanyStatus
  txHash?: string
  joinedAt: number
  onchainJoinedAt?: number
}

export interface UpdateUserCompanyDTO {
  role?: UserCompanyRole
  status?: UserCompanyStatus
  txHash?: string
  onchainJoinedAt?: number
  updatedAt?: number
}

export interface UserWithCompanies {
  userAddress: string
  companies: {
    companyId: string
    role: UserCompanyRole
    status: UserCompanyStatus
  }[]
}

export interface CompanyWithUsers {
  companyId: string
  users: {
    userAddress: string
    role: UserCompanyRole
    status: UserCompanyStatus
  }[]
}
