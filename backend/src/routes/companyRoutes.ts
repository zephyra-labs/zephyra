import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router();

// Create a new company
router.post('/', authMiddleware, adminMiddleware, companyController.createCompany);

// Get all companies
router.get('/', authMiddleware, companyController.getCompanies);

// Get a company by ID
router.get('/:id', authMiddleware, companyController.getCompanyById);

// Update a company by ID
router.put('/:id', authMiddleware, adminMiddleware, companyController.updateCompany);

// Delete a company by ID
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany);

export default router;
