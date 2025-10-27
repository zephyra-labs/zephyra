import { CompanyModel } from "../models/companyModel.js";
import CompanyDTO from "../dtos/companyDTO.js";
import type { Company } from "../types/Company.js";
import { notifyWithAdmins } from "../utils/notificationHelper.js";

export class CompanyService {
  // --- Create company (manual/admin) ---
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

  // --- Update company (manual/admin) ---
  static async updateCompany(id: string, data: Partial<Company>, executor: string): Promise<Company> {
    const existing = await CompanyModel.getById(id);
    if (!existing) throw new Error("Company not found");

    const merged = Object.assign({}, existing, data);
    const safeData: Partial<Company> & Required<Pick<Company, 'name' | 'address' | 'city' | 'stateOrProvince' | 'postalCode' | 'country' | 'email'>> = merged as Partial<Company> & Required<Pick<Company, 'name' | 'address' | 'city' | 'stateOrProvince' | 'postalCode' | 'country' | 'email'>>;

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

  // --- Delete company ---
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

  // --- Get all companies ---
  static async getAllCompanies(): Promise<Company[]> {
    return CompanyModel.getAll();
  }

  // --- Get company by ID ---
  static async getCompanyById(id: string): Promise<Company | null> {
    return CompanyModel.getById(id);
  }

  // --- Auto-create default company for new user ---
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
