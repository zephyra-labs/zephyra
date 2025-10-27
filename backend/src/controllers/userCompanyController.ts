import { Request, Response } from "express"
import { UserCompanyService } from "../services/userCompanyService.js"
import { CompanyService } from "../services/companyService.js"
import type { CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany.js"

export class UserCompanyController {
  // --- Create new relation ---
  static async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateUserCompanyDTO
      const relation = await UserCompanyService.createUserCompany(data)
      return res.status(201).json({ success: true, data: relation })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
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
      return res.status(200).json({ success: true, ...result })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // --- Get relation by ID ---
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const relation = await UserCompanyService.getById(id)
      if (!relation) return res.status(404).json({ success: false, message: "Relation not found" })
      return res.status(200).json({ success: true, data: relation })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // --- Get relations by user ---
  static async getByUser(req: Request, res: Response) {
    try {
      const { address } = req.params
      const relations = await UserCompanyService.getByUser(address)
      return res.status(200).json({ success: true, data: relations })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // --- Get relations by company ---
  static async getByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.params
      const relations = await UserCompanyService.getByCompany(companyId)
      return res.status(200).json({ success: true, data: relations })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // --- Update relation ---
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = req.body as UpdateUserCompanyDTO
      const updated = await UserCompanyService.updateUserCompany(id, data)
      return res.status(200).json({ success: true, data: updated })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
    }
  }

  // --- Delete relation ---
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      await UserCompanyService.deleteUserCompany(id)
      return res.status(200).json({ success: true, message: "Relation deleted" })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
    }
  }

  // --- Get the company of the currently logged-in user ---
  static async getMyCompany(req: Request, res: Response) {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) return res.status(401).json({ success: false, message: "Unauthorized" })

      const relations = await UserCompanyService.getByUser(userAddress)
      const relation = relations[0]
      if (!relation) return res.status(404).json({ success: false, message: "No company relation found" })

      const company = await CompanyService.getCompanyById(relation.companyId)
      if (!company) return res.status(404).json({ success: false, message: "Company not found" })

      return res.status(200).json({ success: true, data: company })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // --- Update the company owned by the currently logged-in user ---
  static async updateMyCompany(req: Request, res: Response) {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) return res.status(401).json({ success: false, message: "Unauthorized" })

      const relations = await UserCompanyService.getByUser(userAddress)
      const relation = relations.find(r => r.userAddress === userAddress)
      if (!relation) return res.status(404).json({ success: false, message: "User is not linked to any company" })
      if (relation.role !== "owner") return res.status(403).json({ success: false, message: "Only company owner can update company data" })

      const updatedCompany = await CompanyService.updateCompany(relation.companyId, req.body, userAddress)
      return res.status(200).json({ success: true, data: updatedCompany })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }
}
