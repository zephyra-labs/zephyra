/**
 * @file userCompanyDTO.ts
 * @description Data Transfer Object for User-Company relationships, including creation, update, and Firestore serialization.
 */

import {
  UserCompany,
  UserCompanyRole,
  UserCompanyStatus,
  CreateUserCompanyDTO,
  UpdateUserCompanyDTO,
} from "../types/UserCompany.js";

/**
 * DTO class for UserCompany entity.
 */
export default class UserCompanyDTO {
  /** Unique ID of the record */
  id: string;

  /** Wallet address of the user */
  userAddress: string;

  /** Company ID */
  companyId: string;

  /** Role of the user in the company */
  role: UserCompanyRole;

  /** Status of the user's membership */
  status: UserCompanyStatus;

  /** Timestamp when user joined (Unix ms) */
  joinedAt: number;

  /** Optional: last update timestamp (Unix ms) */
  updatedAt?: number;

  /** Optional: transaction hash for on-chain membership */
  txHash?: string;

  /** Optional: timestamp when user joined on-chain */
  onchainJoinedAt?: number;

  /**
   * Constructs a new UserCompanyDTO instance
   * @param data Partial UserCompany object
   * @throws {Error} if required fields are missing
   */
  constructor(data: Partial<UserCompany>) {
    if (!data.userAddress) throw new Error("userAddress is required");
    if (!data.companyId) throw new Error("companyId is required");

    this.id = data.id || "";
    this.userAddress = data.userAddress;
    this.companyId = data.companyId;
    this.role = data.role || "staff";
    this.status = data.status || "pending";
    this.joinedAt = data.joinedAt || Date.now();
    this.updatedAt = data.updatedAt;
    this.txHash = data.txHash;
    this.onchainJoinedAt = data.onchainJoinedAt;
  }

  /**
   * Converts DTO into Firestore-compatible object
   * @returns Firestore-ready UserCompany object without ID
   */
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
    };
  }

  /**
   * Creates a UserCompanyDTO from a CreateUserCompanyDTO payload
   * @param dto CreateUserCompanyDTO object
   * @returns New UserCompanyDTO instance
   */
  static fromCreateDTO(dto: CreateUserCompanyDTO): UserCompanyDTO {
    return new UserCompanyDTO({
      userAddress: dto.userAddress,
      companyId: dto.companyId,
      role: dto.role || "staff",
      status: dto.status || "pending",
      joinedAt: Date.now(),
      txHash: dto.txHash,
    });
  }

  /**
   * Applies updates from an UpdateUserCompanyDTO
   * @param dto UpdateUserCompanyDTO object
   */
  applyUpdate(dto: UpdateUserCompanyDTO): void {
    if (dto.role) this.role = dto.role;
    if (dto.status) this.status = dto.status;
    if (dto.txHash) this.txHash = dto.txHash;
    if (dto.onchainJoinedAt) this.onchainJoinedAt = dto.onchainJoinedAt;
    this.updatedAt = dto.updatedAt || Date.now();
  }
}
