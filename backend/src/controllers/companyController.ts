import type { Request, Response } from 'express'
import { CompanyService } from '../services/companyService.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

// POST /company (manual/admin)
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

// GET /company
export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await CompanyService.getAllCompanies()
    return success(res, companies)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch companies')
  }
}

// GET /company/:id
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await CompanyService.getCompanyById(req.params.id)
    if (!company) return failure(res, 'Company not found', 404)
    return success(res, company)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch company details')
  }
}

// PUT /company/:id
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

// DELETE /company/:id
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
