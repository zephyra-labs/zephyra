/**
 * @file UserCompanyService.ts
 * @description Service layer for managing User-Company relationships, including notifications.
 */

import { UserCompanyModel } from "../models/userCompanyModel";
import type { UserCompany, CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany";
import { notifyWithAdmins } from "../utils/notificationHelper";

/**
 * Service class to manage UserCompany CRUD operations with notifications.
 */
export class UserCompanyService {
  /**
   * Create a new user-company relation and notify admins.
   * @param {CreateUserCompanyDTO} data Payload for creating the relation
   * @returns {Promise<UserCompany>} The newly created UserCompany record
   * @throws {Error} If userAddress or companyId is missing, or if the relation already exists
   */
  static async createUserCompany(data: CreateUserCompanyDTO): Promise<UserCompany> {
    if (!data.userAddress) throw new Error("userAddress is required");
    if (!data.companyId) throw new Error("companyId is required");

    const existing = await UserCompanyModel.getByUser(data.userAddress);
    if (existing.find(rel => rel.companyId === data.companyId)) {
      throw new Error(`Relation between user ${data.userAddress} and company ${data.companyId} already exists`);
    }

    const created = await UserCompanyModel.create(data);

    await notifyWithAdmins(data.userAddress, {
      type: "user_company",
      title: `UserCompany Created`,
      message: `UserCompany for user ${data.userAddress} in company ${data.companyId} created.`,
      data: created,
    });

    return created;
  }

  /**
   * Update an existing user-company relation and notify admins.
   * @param {string} id The Firestore document ID of the relation
   * @param {UpdateUserCompanyDTO} data Fields to update
   * @returns {Promise<UserCompany>} Updated UserCompany record
   * @throws {Error} If the UserCompany is not found
   */
  static async updateUserCompany(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany> {
    const updated = await UserCompanyModel.update(id, data);
    if (!updated) throw new Error("UserCompany not found");

    await notifyWithAdmins(updated.userAddress, {
      type: "user_company",
      title: `UserCompany Updated`,
      message: `UserCompany ${id} updated.`,
      data: updated,
    });

    return updated;
  }

  /**
   * Delete a user-company relation and notify admins.
   * @param {string} id The Firestore document ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If the UserCompany is not found
   */
  static async deleteUserCompany(id: string): Promise<boolean> {
    const existing = await UserCompanyModel.getById(id);
    if (!existing) throw new Error("UserCompany not found");

    const deleted = await UserCompanyModel.delete(id);
    if (deleted) {
      await notifyWithAdmins(existing.userAddress, {
        type: "user_company",
        title: `UserCompany Deleted`,
        message: `UserCompany ${id} deleted.`,
        data: existing,
      });
    }
    return deleted;
  }

  /**
   * Retrieve all user-company relations with optional filters and pagination.
   * @param {Object} params Filter and pagination parameters
   * @param {number} params.page Page number (1-based)
   * @param {number} params.limit Items per page
   * @param {string} [params.search] Partial search for userAddress
   * @param {string} [params.role] Filter by role
   * @param {string} [params.status] Filter by status
   * @param {string} [params.companyId] Filter by company ID
   * @returns {Promise<{data: UserCompany[], total: number}>} Paginated list of UserCompany records
   */
  static async getAllFiltered(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
    companyId?: string;
  }): Promise<{ data: UserCompany[]; total: number }> {
    return UserCompanyModel.getAllFiltered(params);
  }

  /**
   * Retrieve a UserCompany record by its ID.
   * @param {string} id Document ID
   * @returns {Promise<UserCompany | null>} The record or null if not found
   */
  static async getById(id: string): Promise<UserCompany | null> {
    return UserCompanyModel.getById(id);
  }

  /**
   * Retrieve all UserCompany records for a given user.
   * @param {string} userAddress Wallet address of the user
   * @returns {Promise<UserCompany[]>} List of UserCompany records
   */
  static async getByUser(userAddress: string): Promise<UserCompany[]> {
    return UserCompanyModel.getByUser(userAddress);
  }

  /**
   * Retrieve all UserCompany records for a given company.
   * @param {string} companyId Company ID
   * @returns {Promise<UserCompany[]>} List of UserCompany records
   */
  static async getByCompany(companyId: string): Promise<UserCompany[]> {
    return UserCompanyModel.getByCompany(companyId);
  }
}
