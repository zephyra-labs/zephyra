import {
  UserCompany,
  UserCompanyRole,
  UserCompanyStatus,
  CreateUserCompanyDTO,
  UpdateUserCompanyDTO,
} from "../types/UserCompany.js"

export default class UserCompanyDTO {
  id: string
  userAddress: string
  companyId: string
  role: UserCompanyRole
  status: UserCompanyStatus
  joinedAt: number
  updatedAt?: number
  txHash?: string
  onchainJoinedAt?: number

  constructor(data: Partial<UserCompany>) {
    if (!data.userAddress) throw new Error("userAddress is required")
    if (!data.companyId) throw new Error("companyId is required")

    this.id = data.id || ""
    this.userAddress = data.userAddress
    this.companyId = data.companyId
    this.role = data.role || "staff"
    this.status = data.status || "pending"
    this.joinedAt = data.joinedAt || Date.now()
    this.updatedAt = data.updatedAt
    this.txHash = data.txHash
    this.onchainJoinedAt = data.onchainJoinedAt
  }

  toFirestore(): Omit<UserCompany, "id"> {
    return {
      userAddress: this.userAddress,
      companyId: this.companyId,
      role: this.role,
      status: this.status,
      joinedAt: this.joinedAt,
      updatedAt: this.updatedAt,
      txHash: this.txHash,
      onchainJoinedAt: this.onchainJoinedAt,
    }
  }

  static fromCreateDTO(dto: CreateUserCompanyDTO): UserCompanyDTO {
    return new UserCompanyDTO({
      userAddress: dto.userAddress,
      companyId: dto.companyId,
      role: dto.role || "staff",
      status: dto.status || "pending",
      joinedAt: Date.now(),
      txHash: dto.txHash,
    })
  }

  applyUpdate(dto: UpdateUserCompanyDTO): void {
    if (dto.role) this.role = dto.role
    if (dto.status) this.status = dto.status
    if (dto.txHash) this.txHash = dto.txHash
    if (dto.onchainJoinedAt) this.onchainJoinedAt = dto.onchainJoinedAt
    this.updatedAt = dto.updatedAt || Date.now()
  }
}
