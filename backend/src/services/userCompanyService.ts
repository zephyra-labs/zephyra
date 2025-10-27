import { UserCompanyModel } from "../models/userCompanyModel.js"
import type { UserCompany, CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany.js"
import { notifyWithAdmins } from "../utils/notificationHelper.js"

export class UserCompanyService {
  // --- Create relation + notify ---
  static async createUserCompany(data: CreateUserCompanyDTO): Promise<UserCompany> {
    if (!data.userAddress) throw new Error("userAddress is required")
    if (!data.companyId) throw new Error("companyId is required")

    // Cek apakah sudah ada relasi
    const existing = await UserCompanyModel.getByUser(data.userAddress)
    if (existing.find(rel => rel.companyId === data.companyId)) {
      throw new Error(`Relation between user ${data.userAddress} and company ${data.companyId} already exists`)
    }

    const created = await UserCompanyModel.create(data)

    await notifyWithAdmins(data.userAddress, {
      type: "userCompany",
      title: `UserCompany Created`,
      message: `UserCompany for user ${data.userAddress} in company ${data.companyId} created.`,
      data: created,
    })

    return created
  }

  // --- Update relation + notify ---
  static async updateUserCompany(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany | null> {
    const updated = await UserCompanyModel.update(id, data)
    if (!updated) throw new Error("UserCompany not found")

    await notifyWithAdmins(updated.userAddress, {
      type: "userCompany",
      title: `UserCompany Updated`,
      message: `UserCompany ${id} updated.`,
      data: updated,
    })

    return updated
  }

  // --- Delete relation + notify ---
  static async deleteUserCompany(id: string): Promise<boolean> {
    const existing = await UserCompanyModel.getById(id)
    if (!existing) throw new Error("UserCompany not found")

    const deleted = await UserCompanyModel.delete(id)
    if (deleted) {
      await notifyWithAdmins(existing.userAddress, {
        type: "userCompany",
        title: `UserCompany Deleted`,
        message: `UserCompany ${id} deleted.`,
        data: existing,
      })
    }
    return deleted
  }

  // --- Get all filtered ---
  static async getAllFiltered(params: {
    page: number
    limit: number
    search?: string
    role?: string
    status?: string
    companyId?: string
  }): Promise<{ data: UserCompany[]; total: number }> {
    return UserCompanyModel.getAllFiltered(params)
  }

  // --- Get by ID ---
  static async getById(id: string): Promise<UserCompany | null> {
    return UserCompanyModel.getById(id)
  }

  // --- Get by User ---
  static async getByUser(userAddress: string): Promise<UserCompany[]> {
    return UserCompanyModel.getByUser(userAddress)
  }

  // --- Get by Company ---
  static async getByCompany(companyId: string): Promise<UserCompany[]> {
    return UserCompanyModel.getByCompany(companyId)
  }
}
