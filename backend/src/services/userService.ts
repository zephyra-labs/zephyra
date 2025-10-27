import jwt from 'jsonwebtoken';
import { UserModel } from "../models/UserModel.js";
import { notifyWithAdmins } from "../utils/notificationHelper.js";
import UserDTO, { CreateUserDTO, UpdateUserDTO } from "../dtos/UserDTO.js";
import type { User } from "../types/User.js";
import { UserCompanyService } from './userCompanyService.js';
import { CompanyService } from './companyService.js';

export class UserService {
  // --- Wallet connect / auto-register ---
  static async walletConnect(data: Partial<User> & { address: string }) {
    if (!data.address) throw new Error("Address is required");

    const dto = new UserDTO(data);

    // Check if user exists
    let user = await UserModel.getByAddress(dto.address);
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await UserModel.create(new CreateUserDTO(dto.toFirestore()).toFirestore());
      isNewUser = true;

      await notifyWithAdmins(user.address, {
        type: "user",
        title: `User Created: ${user.address}`,
        message: `User ${user.address} auto-registered.`,
        data: user,
      });
    } else {
      // Update last login
      const updated = await UserModel.update(user.address, { lastLoginAt: Date.now() });
      if (updated) user = updated;
    }

    // Create default company and user-company relation for new user
    if (isNewUser && user) {
      const company = await CompanyService.createDefaultForUser(user.address);
      if (company?.id) {
        await UserCompanyService.createUserCompany({
          userAddress: user.address,
          companyId: company.id,
          role: 'owner',
          status: 'active',
          joinedAt: Date.now(),
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { address: user.address },
      process.env.JWT_SECRET ?? "",
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  // --- Create new user ---
  static async createUser(data: Partial<User> & { address: string }): Promise<User> {
    if (!data.address) throw new Error("Address is required");
    const dto = new CreateUserDTO(data);
    const user = await UserModel.create(dto.toFirestore());

    await notifyWithAdmins(user.address, {
      type: "user",
      title: `User Created: ${user.address}`,
      message: `User ${user.address} created.`,
      data: user,
    });

    return user;
  }

  // --- Update user by admin ---
  static async updateUser(
    address: string,
    data: Partial<User> & { kycStatus?: 'pending' | 'approved' | 'rejected' }
  ): Promise<User | null> {
    const dto = new UpdateUserDTO(data);
    const current = await UserModel.getByAddress(address);
    if (!current) throw new Error("User not found");

    const updatedMetadata = {
      ...current.metadata,
      ...(dto.metadata ?? {}),
      ...(dto.kycStatus ? { kycStatus: dto.kycStatus } : {}),
    };

    const updateData: Partial<User> = {
      ...dto,
      metadata: updatedMetadata,
      lastLoginAt: dto.lastLoginAt ?? current.lastLoginAt,
    };

    const updated = await UserModel.update(address, updateData);
    if (updated) {
      await notifyWithAdmins(updated.address, {
        type: "user",
        title: `User Updated: ${updated.address}`,
        message: `User ${updated.address} updated.`,
        data: updated,
      });
    }
    return updated;
  }

  // --- Update current user's profile ---
  static async updateMe(address: string, metadata: Partial<User['metadata']>): Promise<User | null> {
    const current = await UserModel.getByAddress(address);
    if (!current) throw new Error("User not found");

    const updateData: Partial<User> = {
      metadata: { ...current.metadata, ...metadata },
    };

    const updated = await UserModel.update(address, updateData);
    return updated;
  }

  // --- Update only KYC status ---
  static async updateKYCStatus(address: string, status: 'pending' | 'approved' | 'rejected') {
    return this.updateUser(address, { kycStatus: status });
  }

  // --- Delete user ---
  static async deleteUser(address: string): Promise<boolean> {
    const user = await UserModel.getByAddress(address);
    if (!user) throw new Error("User not found");

    const deleted = await UserModel.delete(address);
    if (deleted) {
      await notifyWithAdmins(address, {
        type: "user",
        title: `User Deleted: ${address}`,
        message: `User ${address} deleted.`,
        data: user,
      });
    }
    return deleted;
  }

  // --- Get user by address ---
  static async getUser(address: string): Promise<User | null> {
    return UserModel.getByAddress(address);
  }

  // --- Get all users ---
  static async getAllUsers(): Promise<User[]> {
    return UserModel.getAll();
  }
}
