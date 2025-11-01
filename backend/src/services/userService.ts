/** 
 * @file userService.ts
 * @description Service layer for User entity handling business logic, user creation, updates, and wallet connections.
 */

import jwt from 'jsonwebtoken';
import { UserModel } from "../models/userModel.js";
import { notifyWithAdmins } from "../utils/notificationHelper.js";
import UserDTO, { CreateUserDTO, UpdateUserDTO } from "../dtos/userDTO.js";
import type { User } from "../types/User.js";
import { UserCompanyService } from './userCompanyService.js';
import { CompanyService } from './companyService.js';

export class UserService {
  /**
   * Handles wallet connection.  
   * - Auto-registers user if not exists.  
   * - Updates last login timestamp if exists.  
   * - Creates default company and user-company relation for new users.  
   * - Returns JWT for session authentication.
   *
   * @param {Partial<User> & { address: string }} data - User wallet data.
   * @returns {Promise<{ user: User; token: string }>} Created or existing user and JWT token.
   * @throws {Error} If wallet address is missing or database operation fails.
   */
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

  /**
   * Creates a new user manually by admin or system.
   *
   * @param {Partial<User> & { address: string }} data - User data to create.
   * @returns {Promise<User>} Newly created user.
   * @throws {Error} If address is missing or creation fails.
   */
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

  /**
   * Updates a user (admin privilege).  
   * Can modify metadata, role, and KYC status.
   *
   * @param {string} address - Wallet address of the user.
   * @param {Partial<User> & { kycStatus?: 'pending' | 'approved' | 'rejected' }} data - Update payload.
   * @returns {Promise<User | null>} Updated user object, or null if not found.
   * @throws {Error} If user not found or update fails.
   */
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

  /**
   * Updates the currently authenticated user's profile metadata.
   *
   * @param {string} address - Wallet address of the current user.
   * @param {Partial<User['metadata']>} metadata - Partial metadata fields to update.
   * @returns {Promise<User | null>} Updated user or null if not found.
   * @throws {Error} If user not found.
   */
  static async updateMe(address: string, metadata: Partial<User['metadata']>): Promise<User | null> {
    const current = await UserModel.getByAddress(address);
    if (!current) throw new Error("User not found");

    const updateData: Partial<User> = {
      metadata: { ...current.metadata, ...metadata },
    };

    const updated = await UserModel.update(address, updateData);
    return updated;
  }

  /**
   * Updates only the user's KYC status.  
   * Used by admin during verification review.
   *
   * @param {string} address - Wallet address of the user.
   * @param {'pending' | 'approved' | 'rejected'} status - New KYC status.
   * @returns {Promise<User | null>} Updated user or null if not found.
   */
  static async updateKYCStatus(address: string, status: 'pending' | 'approved' | 'rejected') {
    return this.updateUser(address, { kycStatus: status });
  }

  /**
   * Deletes a user permanently from the system.  
   * Also triggers admin notification.
   *
   * @param {string} address - Wallet address of the user to delete.
   * @returns {Promise<boolean>} True if deleted successfully.
   * @throws {Error} If user not found or deletion fails.
   */
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

  /**
   * Retrieves a single user by wallet address.
   *
   * @param {string} address - Wallet address.
   * @returns {Promise<User | null>} User object or null if not found.
   */
  static async getUser(address: string): Promise<User | null> {
    return UserModel.getByAddress(address);
  }

  /**
   * Retrieves all users in the system.
   *
   * @returns {Promise<User[]>} List of all users.
   */
  static async getAllUsers(): Promise<User[]> {
    return UserModel.getAll();
  }
}
