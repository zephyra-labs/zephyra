/**
 * @file UserCompanyController.ts
 * @description Controller for handling User-Company relations, including CRUD and user-specific operations.
 */

import { Request, Response } from "express";
import { UserCompanyService } from "../services/userCompanyService";
import { CompanyService } from "../services/companyService";
import type { AuthRequest } from "../middlewares/authMiddleware"
import type { CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany";
import { success, failure, handleError } from "../utils/responseHelper";

/**
 * Controller class for UserCompany operations.
 */
export class UserCompanyController {
  /**
   * Create a new user-company relation.
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Created UserCompany record
   * @throws {Error} If creation fails
   */
  static async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateUserCompanyDTO;
      const relation = await UserCompanyService.createUserCompany(data);
      return success(res, relation, 201);
    } catch (err) {
      return handleError(res, err, "Failed to create user-company relation", 500);
    }
  }

  /**
   * Get all user-company relations with optional filters.
   * @param {Request} req Express request with query params: page, limit, search, role, status, companyId
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Paginated list of UserCompany records
   */
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;
      const role = (req.query.role as string) || undefined;
      const status = (req.query.status as string) || undefined;
      const companyId = (req.query.companyId as string) || undefined;

      const result = await UserCompanyService.getAllFiltered({ page, limit, search, role, status, companyId });
      return success(res, result);
    } catch (err) {
      return handleError(res, err, "Failed to fetch user-company relations");
    }
  }

  /**
   * Get a UserCompany relation by ID.
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Promise<Response>} UserCompany record
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return failure(res, "Missing id parameter", 422);

      const relation = await UserCompanyService.getById(id);
      if (!relation) return failure(res, "Relation not found", 404);

      return success(res, relation, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch relation", 500);
    }
  }

  /**
   * Get all relations for a given user.
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Promise<Response>} List of UserCompany records
   */
  static async getByUser(req: Request, res: Response) {
    try {
      const { address } = req.params;
      if (!address) return failure(res, "Missing user address", 422);

      const relations = await UserCompanyService.getByUser(address);
      if (!relations.length) return failure(res, "No relations found for user", 404);

      return success(res, relations, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch user relations", 500);
    }
  }

  /**
   * Get all relations for a given company.
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Promise<Response>} List of UserCompany records
   */
  static async getByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      if (!companyId) return failure(res, "Missing companyId parameter", 422);

      const relations = await UserCompanyService.getByCompany(companyId);
      if (!relations.length) return failure(res, "No relations found for company", 404);

      return success(res, relations, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch company relations", 500);
    }
  }

  /**
   * Update a UserCompany relation.
   * @param {Request} req Express request with body containing UpdateUserCompanyDTO
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Updated UserCompany record
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return failure(res, "Missing id parameter", 422);

      const data = req.body as UpdateUserCompanyDTO;
      const updated = await UserCompanyService.updateUserCompany(id, data);
      return success(res, updated, 200);
    } catch (err) {
      return handleError(res, err, "Failed to update relation", 500);
    }
  }

  /**
   * Delete a UserCompany relation.
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Success message
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return failure(res, "Missing id parameter", 422);

      await UserCompanyService.deleteUserCompany(id);
      return success(res, { message: "Relation deleted successfully" }, 200);
    } catch (err) {
      return handleError(res, err, "Failed to delete relation", 500);
    }
  }

  /**
   * Get the company of the currently logged-in user.
   * @param {Request} req Express request object with user info
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Company details
   */
  static async getMyCompany(req: AuthRequest, res: Response) {
    try {
      const userAddress = req.user?.address;
      if (!userAddress) return failure(res, "Missing or invalid Authorization header", 401);

      const relations = await UserCompanyService.getByUser(userAddress);
      const relation = relations[0];
      if (!relation) return failure(res, "No company relation found", 404);

      const company = await CompanyService.getCompanyById(relation.companyId);
      if (!company) return failure(res, "Company not found", 404);

      return success(res, company, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch user's company", 500);
    }
  }

  /**
   * Update the company owned by the currently logged-in user.
   * @param {Request} req Express request object with user info and update body
   * @param {Response} res Express response object
   * @returns {Promise<Response>} Updated company details
   */
  static async updateMyCompany(req: AuthRequest, res: Response) {
    try {
      const userAddress = req.user?.address;
      if (!userAddress) return failure(res, "Missing or invalid Authorization header", 401);

      const relations = await UserCompanyService.getByUser(userAddress);
      const relation = relations.find(r => r.userAddress === userAddress);
      if (!relation) return failure(res, "User is not linked to any company", 404);
      if (relation.role !== "owner") return failure(res, "Only company owner can update company data", 403);

      const updatedCompany = await CompanyService.updateCompany(relation.companyId, req.body, userAddress);
      return success(res, updatedCompany, 200);
    } catch (err) {
      return handleError(res, err, "Failed to update company", 500);
    }
  }
}
