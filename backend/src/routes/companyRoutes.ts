import { Router } from 'express'
import * as companyController from '../controllers/companyController.js'
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router()

/**
 * --- Company Routes ---
 * Manage companies in the system.
 * Admin-only routes are protected with adminMiddleware.
 */

/**
 * POST /companies
 * Create a new company (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, companyController.createCompany)

/**
 * GET /companies
 * Retrieve all companies
 */
router.get('/', authMiddleware, companyController.getCompanies)

/**
 * GET /companies/:id
 * Retrieve a single company by ID
 */
router.get('/:id', authMiddleware, companyController.getCompanyById)

/**
 * PUT /companies/:id
 * Update a company by ID (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, companyController.updateCompany)

/**
 * DELETE /companies/:id
 * Delete a company by ID (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany)

export default router
