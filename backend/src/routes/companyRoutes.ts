/**
 * @file companyRoutes.ts
 * @description Routes for managing companies in the system. Admin-only actions are protected.
 */

import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = Router();

/**
 * Create a new company
 * @route POST /companies
 * @group Companies
 * @security BearerAuth
 * @returns {object} 201 - Newly created company
 */
router.post('/', authMiddleware, adminMiddleware, companyController.createCompany);

/**
 * Get all companies
 * @route GET /companies
 * @group Companies
 * @security BearerAuth
 * @returns {Array.<object>} 200 - List of companies
 */
router.get('/', authMiddleware, companyController.getCompanies);

/**
 * Get a company by ID
 * @route GET /companies/{id}
 * @group Companies
 * @param {string} id.path.required - Company ID
 * @security BearerAuth
 * @returns {object} 200 - Company details
 */
router.get('/:id', authMiddleware, companyController.getCompanyById);

/**
 * Update a company by ID
 * @route PUT /companies/{id}
 * @group Companies
 * @param {string} id.path.required - Company ID
 * @security BearerAuth
 * @returns {object} 200 - Updated company details
 */
router.put('/:id', authMiddleware, adminMiddleware, companyController.updateCompany);

/**
 * Delete a company by ID
 * @route DELETE /companies/{id}
 * @group Companies
 * @param {string} id.path.required - Company ID
 * @security BearerAuth
 * @returns {object} 200 - Success message
 */
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany);

export default router;
