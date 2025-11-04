/**
 * @file companyService.ts
 * @description Business logic for managing companies: create, update, delete, get, and default creation for new users.
 */

import { CompanyModel } from "../models/companyModel";
import CompanyDTO from "../dtos/companyDTO";
import type { Company } from "../types/Company";
import { notifyWithAdmins } from "../utils/notificationHelper";

export class CompanyService {
  /**
   * Create a new company (manual/admin creation).
   *
   * @async
   * @param {Partial<Company>} data - Partial company data.
   * @param {string} executor - User creating the company.
   * @returns {Promise<Company>} The newly created company.
   */
  static async createCompany(data: Partial<Company>, executor: string): Promise<Company> {
    const safeData: Partial<Company> & Required<Pick<Company, 'name' | 'address' | 'city' | 'stateOrProvince' | 'postalCode' | 'country' | 'email'>> = {
      name: data.name || `Company of ${executor}`,
      address: data.address || executor,
      city: data.city || 'City',
      stateOrProvince: data.stateOrProvince || 'Province',
      postalCode: data.postalCode || '00000',
      country: data.country || 'Country',
      email: data.email || `${executor}@example.com`,
      ...data,
    };

    const dto = new CompanyDTO(safeData);
    dto.validate();
    dto.createdAt = Date.now();

    const company = await CompanyModel.create(dto.toJSON());

    await notifyWithAdmins(executor, {
      type: 'system',
      title: 'Company Created',
      message: `Company "${dto.name}" created by ${executor}.`,
      data: { companyId: company.id, name: dto.name },
    });

    return company;
  }

  /**
   * Update an existing company (manual/admin update).
   *
   * @async
   * @param {string} id - Company ID.
   * @param {Partial<Company>} data - Data to update.
   * @param {string} executor - User performing the update.
   * @returns {Promise<Company>} Updated company.
   * @throws {Error} If company not found or update fails.
   */
  static async updateCompany(id: string, data: Partial<Company>, executor: string): Promise<Company> {
    const existing = await CompanyModel.getById(id);
    if (!existing) throw new Error("Company not found");

    const safeData: Partial<Company> & Required<
      Pick<Company, 'name' | 'address' | 'city' | 'stateOrProvince' | 'postalCode' | 'country' | 'email'>
    > = {
      ...existing,
      ...data,
    };

    const dto = new CompanyDTO(safeData);
    dto.validate();
    dto.updatedAt = Date.now();

    const updated = await CompanyModel.update(id, dto.toJSON());
    if (!updated) throw new Error("Failed to update company");
    
    await notifyWithAdmins(executor, {
      type: 'system',
      title: 'Company Updated',
      message: `Company "${dto.name}" updated by ${executor}.`,
      data: { companyId: id, name: dto.name },
    });

    return updated;
  }

  /**
   * Delete a company.
   *
   * @async
   * @param {string} id - Company ID to delete.
   * @param {string} executor - User performing the deletion.
   * @returns {Promise<boolean>} True if deletion successful.
   * @throws {Error} If company not found.
   */
  static async deleteCompany(id: string, executor: string): Promise<boolean> {
    const existing = await CompanyModel.getById(id);
    if (!existing) throw new Error("Company not found");

    await CompanyModel.delete(id);

    await notifyWithAdmins(executor, {
      type: 'system',
      title: 'Company Deleted',
      message: `Company "${existing.name}" deleted by ${executor}.`,
      data: { companyId: id, name: existing.name },
    });

    return true;
  }

  /**
   * Get all companies.
   *
   * @async
   * @returns {Promise<Company[]>} List of companies.
   */
  static async getAllCompanies(): Promise<Company[]> {
    return CompanyModel.getAll();
  }

  /**
   * Get company by ID.
   *
   * @async
   * @param {string} id - Company ID.
   * @returns {Promise<Company | null>} Company data or null if not found.
   */
  static async getCompanyById(id: string): Promise<Company | null> {
    return CompanyModel.getById(id);
  }

  /**
   * Auto-create a default company for a new user.
   *
   * @async
   * @param {string} address - User wallet address.
   * @returns {Promise<Company>} The created default company.
   */
  static async createDefaultForUser(address: string): Promise<Company> {
    const data: Omit<Company, 'id'> = {
      name: `Company of ${address}`,
      address: 'Street Address',
      city: 'City',
      stateOrProvince: 'Province',
      postalCode: '00000',
      country: 'Country',
      email: 'email@example.com',
      phone: '+1234567890',
      taxId: '1234567890',
      registrationNumber: '1234567890',
      businessType: 'Business Type',
      website: 'https://example.com',
      walletAddress: address,
      verified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const company = await CompanyModel.create(data);

    await notifyWithAdmins(address, {
      type: 'system',
      title: 'Company Created',
      message: `Company "${company.name}" created for user ${address}.`,
      data: { companyId: company.id, name: company.name },
    });

    return company;
  }
}
