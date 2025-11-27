/**
 * @file companyController.ts
 * @description Express controller for managing companies.
 * Supports CRUD operations: create, read, update, and delete companies.
 */

import type { Request, Response } from 'express'
import { CompanyService } from '../services/companyService'
import { success, failure, handleError } from '../utils/responseHelper'

/**
 * Create a new company (manual/admin action).
 *
 * @route POST /company
 * @param {Request} req - Express request object, expects `executor` and company data in body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with created company or error.
 */
export const createCompany = async (req: Request, res: Response) => {
  try {
    const { executor, ...data } = req.body

    // 400: executor missing
    if (!executor) return failure(res, 'Executor is required', 400)

    // 422: validate required company fields (example: name)
    if (!data.name || typeof data.name !== 'string') {
      return failure(res, 'Company name is required and must be a string', 422)
    }

    const company = await CompanyService.createCompany(data, executor)
    return success(res, company, 201)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to create company', 500)
  }
}

/**
 * Get all companies.
 *
 * @route GET /company
 * @param {Request} _req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with list of companies.
 */
export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await CompanyService.getAllCompanies()
    return success(res, companies, 200)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to fetch companies', 500)
  }
}

/**
 * Get a specific company by ID.
 *
 * @route GET /company/:id
 * @param {Request} req - Express request object, expects `id` param.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with company data or 404 error.
 */
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 400: missing ID
    if (!id) return failure(res, 'Company ID is required', 400)

    const company = await CompanyService.getCompanyById(id)
    if (!company) return failure(res, 'Company not found', 404)
    return success(res, company, 200)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to fetch company details', 500)
  }
}

/**
 * Update a company by ID.
 *
 * @route PUT /company/:id
 * @param {Request} req - Express request object, expects `executor` and update data in body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with updated company data or error.
 */
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { executor, ...data } = req.body

    // 400: missing ID or executor
    if (!id) return failure(res, 'Company ID is required', 400)
    if (!executor) return failure(res, 'Executor is required', 400)

    // 422: optional validation for fields
    if (data.name && typeof data.name !== 'string') {
      return failure(res, 'Company name must be a string', 422)
    }

    const updated = await CompanyService.updateCompany(id, data, executor)
    if (!updated) return failure(res, 'Company not found', 404)
    return success(res, updated, 200)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to update company', 500)
  }
}

/**
 * Delete a company by ID.
 *
 * @route DELETE /company/:id
 * @param {Request} req - Express request object, expects `executor` in body or headers.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with success message or error.
 */
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const executor = req.body.executor || req.headers['x-executor']?.toString()

    // 400: missing ID or executor
    if (!id) return failure(res, 'Company ID is required', 400)
    if (!executor) return failure(res, 'Executor is required', 400)

    const deleted = await CompanyService.deleteCompany(id, executor)
    if (!deleted) return failure(res, 'Company not found', 404)

    return success(res, { message: 'Company deleted successfully' }, 200)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to delete company', 500)
  }
}
