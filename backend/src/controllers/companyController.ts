/**
 * @file companyController.ts
 * @description Express controller for managing companies.
 * Supports CRUD operations: create, read, update, and delete companies.
 */

import type { Request, Response } from 'express'
import { CompanyService } from '../services/companyService.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

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
    if (!executor) return failure(res, 'Executor is required')

    const company = await CompanyService.createCompany(data, executor)
    return success(res, company, 201)
  } catch (err) {
    return handleError(res, err, 'Failed to create company')
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
    return success(res, companies)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch companies')
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
    const company = await CompanyService.getCompanyById(req.params.id)
    if (!company) return failure(res, 'Company not found', 404)
    return success(res, company)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch company details')
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
    const { executor, ...data } = req.body
    if (!executor) return failure(res, 'Executor is required')

    const updated = await CompanyService.updateCompany(req.params.id, data, executor)
    return success(res, updated)
  } catch (err) {
    return handleError(res, err, 'Failed to update company')
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
    const executor = req.body.executor || req.headers['x-executor']?.toString()
    if (!executor) return failure(res, 'Executor is required')

    await CompanyService.deleteCompany(req.params.id, executor)
    return success(res, { message: 'Company deleted successfully' })
  } catch (err) {
    return handleError(res, err, 'Failed to delete company')
  }
}
