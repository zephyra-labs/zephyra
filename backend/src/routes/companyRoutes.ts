/**
 * @file companyRoutes.ts
 * @description Company management routes with Swagger/OpenAPI 3.0 documentation
 */

import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 * 
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         stateOrProvince:
 *           type: string
 *         postalCode:
 *           type: string
 *         country:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         taxId:
 *           type: string
 *         registrationNumber:
 *           type: string
 *         businessType:
 *           type: string
 *         website:
 *           type: string
 *         walletAddress:
 *           type: string
 *         verified:
 *           type: boolean
 *         createdAt:
 *           type: integer
 *         updatedAt:
 *           type: integer
 * tags:
 *   - name: Companies
 *     description: Company management endpoints
 */

/**
 * @swagger
 * /api/company:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company (Admin only)
 *     description: Store a new company in the system. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *           example:
 *             executor: "admin-user-123"
 *             name: "Example Corp"
 *             address: "123 Main Street"
 *             city: "New York"
 *             stateOrProvince: "NY"
 *             postalCode: "10001"
 *             country: "USA"
 *             email: "contact@example.com"
 *             phone: "+1-555-1234"
 *             taxId: "123456789"
 *             registrationNumber: "987654321"
 *             businessType: "IT Services"
 *             website: "https://example.com"
 *             walletAddress: "0xAdminWallet..."
 *             verified: false
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "company-123"
 *                     name: "Example Corp"
 *                     address: "123 Main Street"
 *                     city: "New York"
 *                     website: "https://example.com"
 *
 *       400:
 *         description: Missing executor field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Executor is required"
 *
 *       422:
 *         description: Invalid or missing company fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company name is required and must be a string"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 * 
 *       403:
 *         description: Forbidden — forbidden: admins only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Forbidden: Admins only"
 *
 *       500:
 *         description: Server error while creating company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create company"
 */
router.post('/', authMiddleware, adminMiddleware, companyController.createCompany)

/**
 * @swagger
 * /api/company:
 *   get:
 *     tags: [Companies]
 *     summary: Get all companies
 *     description: Retrieve a list of all companies.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "company-123"
 *                       name: "Example Corp"
 *                       address: "123 Main Street"
 *                       city: "New York"
 *                       stateOrProvince: "NY"
 *                       postalCode: "10001"
 *                       country: "USA"
 *                       email: "contact@example.com"
 *                       phone: "+1-555-1234"
 *                       taxId: "123456789"
 *                       registrationNumber: "987654321"
 *                       businessType: "IT Services"
 *                       website: "https://example.com"
 *                       walletAddress: "0xAdminWallet..."
 *                       verified: false
 *                       createdAt: 1699999999
 *                       updatedAt: 1699999999
 *                     - id: "company-124"
 *                       name: "Another Inc"
 *                       address: "456 Side Avenue"
 *                       city: "Los Angeles"
 *                       stateOrProvince: "CA"
 *                       postalCode: "90001"
 *                       country: "USA"
 *                       email: "info@another.com"
 *                       phone: "+1-555-5678"
 *                       taxId: "987654321"
 *                       registrationNumber: "123456789"
 *                       businessType: "Marketing"
 *                       website: "https://another.com"
 *                       walletAddress: "0xAnotherWallet..."
 *                       verified: true
 *                       createdAt: 1699998888
 *                       updatedAt: 1699998888
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while fetching companies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch companies"
 */
router.get('/', authMiddleware, companyController.getCompanies);

/**
 * @swagger
 * /api/company/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get a company by ID
 *     description: Retrieve details of a specific company by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: "company-123"
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "company-123"
 *                     name: "Example Corp"
 *                     address: "123 Main Street"
 *                     city: "Bangkok"
 *                     stateOrProvince: "Bangkok"
 *                     postalCode: "10110"
 *                     country: "Thailand"
 *                     email: "contact@example.com"
 *                     phone: "+66 2 123 4567"
 *                     taxId: "1234567890"
 *                     registrationNumber: "REG-987654"
 *                     businessType: "IT Services"
 *                     website: "https://example.com"
 *                     walletAddress: "0x123abc..."
 *                     verified: true
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699286400000
 *
 *       400:
 *         description: Missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company ID is required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company not found"
 *
 *       500:
 *         description: Server error while fetching company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch company details"
 */
router.get('/:id', authMiddleware, companyController.getCompanyById)

/**
 * @swagger
 * /api/company/{id}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company by ID (Admin only)
 *     description: Update details of an existing company. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: "company-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *           example:
 *             name: "Updated Corp"
 *             address: "789 New Street"
 *             city: "Bangkok"
 *             stateOrProvince: "Bangkok"
 *             postalCode: "10120"
 *             country: "Thailand"
 *             email: "newcontact@example.com"
 *             phone: "+66 2 765 4321"
 *             taxId: "9876543210"
 *             registrationNumber: "REG-123456"
 *             businessType: "Consulting"
 *             website: "https://updated.com"
 *             walletAddress: "0xUpdatedWallet..."
 *             verified: true
 *             executor: "0xAdminWallet..."  # wajib
 *     responses:
 *       200:
 *         description: Updated company details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *             examples:
 *               success:
 *                 summary: Example successful update
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "company-123"
 *                     name: "Updated Corp"
 *                     address: "789 New Street"
 *                     city: "Bangkok"
 *                     stateOrProvince: "Bangkok"
 *                     postalCode: "10120"
 *                     country: "Thailand"
 *                     email: "newcontact@example.com"
 *                     phone: "+66 2 765 4321"
 *                     taxId: "9876543210"
 *                     registrationNumber: "REG-123456"
 *                     businessType: "Consulting"
 *                     website: "https://updated.com"
 *                     walletAddress: "0xUpdatedWallet..."
 *                     verified: true
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *
 *       400:
 *         description: Missing required fields (ID or executor)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingExecutor:
 *                 summary: Missing executor
 *                 value:
 *                   success: false
 *                   message: "Executor is required"
 *               missingId:
 *                 summary: Missing company ID
 *                 value:
 *                   success: false
 *                   message: "Company ID is required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company not found"
 *
 *       422:
 *         description: Invalid data types in payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company name must be a string"
 *
 *       500:
 *         description: Server error while updating company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update company"
 */
router.put('/:id', authMiddleware, adminMiddleware, companyController.updateCompany)

/**
 * @swagger
 * /api/company/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete a company by ID (Admin only)
 *     description: Deletes a company. Requires admin authentication. The executor must be provided either in the request body or in the `x-executor` header.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: "company-123"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               executor:
 *                 type: string
 *                 description: Wallet address of the user performing the deletion
 *                 example: "0xAdminWallet..."
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Company deleted successfully"
 *
 *       400:
 *         description: Missing required executor or ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingExecutor:
 *                 summary: Executor not provided
 *                 value:
 *                   success: false
 *                   message: "Executor is required"
 *               missingId:
 *                 summary: Company ID not provided
 *                 value:
 *                   success: false
 *                   message: "Company ID is required"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Company not found"
 *
 *       500:
 *         description: Server error while deleting company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete company"
 */
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany)

export default router;
