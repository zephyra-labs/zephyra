import { Request, Response } from "express"
import { UserCompanyService } from "../services/userCompanyService.js"
import { CompanyService } from "../services/companyService.js"
import type { CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

export class UserCompanyController {
  // --- Create new relation ---
  static async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateUserCompanyDTO
      const relation = await UserCompanyService.createUserCompany(data)
      return success(res, relation, 201)
    } catch (err) {
      return handleError(res, err, "Failed to create user-company relation", 400)
    }
  }

  // --- Get all relations with filters ---
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const search = (req.query.search as string) || undefined
      const role = (req.query.role as string) || undefined
      const status = (req.query.status as string) || undefined
      const companyId = (req.query.companyId as string) || undefined

      const result = await UserCompanyService.getAllFiltered({ page, limit, search, role, status, companyId })
      return success(res, result)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user-company relations")
    }
  }

  // --- Get relation by ID ---
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const relation = await UserCompanyService.getById(id)
      if (!relation) return failure(res, "Relation not found", 404)
      return success(res, relation)
    } catch (err) {
      return handleError(res, err, "Failed to fetch relation")
    }
  }

  // --- Get relations by user ---
  static async getByUser(req: Request, res: Response) {
    try {
      const { address } = req.params
      const relations = await UserCompanyService.getByUser(address)
      return success(res, relations)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user relations")
    }
  }

  // --- Get relations by company ---
  static async getByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.params
      const relations = await UserCompanyService.getByCompany(companyId)
      return success(res, relations)
    } catch (err) {
      return handleError(res, err, "Failed to fetch company relations")
    }
  }

  // --- Update relation ---
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = req.body as UpdateUserCompanyDTO
      const updated = await UserCompanyService.updateUserCompany(id, data)
      return success(res, updated)
    } catch (err) {
      return handleError(res, err, "Failed to update relation", 400)
    }
  }

  // --- Delete relation ---
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      await UserCompanyService.deleteUserCompany(id)
      return success(res, { message: "Relation deleted successfully" })
    } catch (err) {
      return handleError(res, err, "Failed to delete relation", 400)
    }
  }

  // --- Get the company of the currently logged-in user ---
  static async getMyCompany(req: Request, res: Response) {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) return failure(res, "Unauthorized", 401)

      const relations = await UserCompanyService.getByUser(userAddress)
      const relation = relations[0]
      if (!relation) return failure(res, "No company relation found", 404)

      const company = await CompanyService.getCompanyById(relation.companyId)
      if (!company) return failure(res, "Company not found", 404)

      return success(res, company)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user's company")
    }
  }

  // --- Update the company owned by the currently logged-in user ---
  static async updateMyCompany(req: Request, res: Response) {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) return failure(res, "Unauthorized", 401)

      const relations = await UserCompanyService.getByUser(userAddress)
      const relation = relations.find(r => r.userAddress === userAddress)
      if (!relation) return failure(res, "User is not linked to any company", 404)
      if (relation.role !== "owner") return failure(res, "Only company owner can update company data", 403)

      const updatedCompany = await CompanyService.updateCompany(relation.companyId, req.body, userAddress)
      return success(res, updatedCompany)
    } catch (err) {
      return handleError(res, err, "Failed to update company")
    }
  }
}
