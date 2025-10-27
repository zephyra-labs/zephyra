import type { User, UserMetadata, UserRole } from "../types/User.js";

export default class UserDTO {
  address: string
  role: UserRole
  createdAt: number
  lastLoginAt: number
  metadata?: UserMetadata

  constructor(data: Partial<User>) {
    if (!data.address) throw new Error("address is required")

    this.address = data.address
    this.role = data.role || "user"
    this.createdAt = data.createdAt || Date.now()
    this.lastLoginAt = data.lastLoginAt || Date.now()
    this.metadata = data.metadata || {}
  }

  toFirestore(): User {
    return {
      address: this.address,
      role: this.role,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      metadata: this.metadata,
    }
  }
}

export class CreateUserDTO {
  address: string;
  role?: UserRole;
  metadata?: UserMetadata;

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

export class UpdateUserDTO {
  role?: UserRole;
  metadata?: Partial<UserMetadata>;
  lastLoginAt?: number;
  kycStatus?: "pending" | "approved" | "rejected";

  constructor(data: Partial<User> & { kycStatus?: "pending" | "approved" | "rejected" }) {
    this.role = data.role;
    this.metadata = data.metadata;
    this.lastLoginAt = data.lastLoginAt;
    this.kycStatus = data.kycStatus;
  }
}
