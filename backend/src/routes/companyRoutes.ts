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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Newly created company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.post('/', authMiddleware, adminMiddleware, companyController.createCompany);

/**
 * @swagger
 * /api/company:
 *   get:
 *     tags: [Companies]
 *     summary: Get all companies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */
router.get('/', authMiddleware, companyController.getCompanies);

/**
 * @swagger
 * /api/company/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get a company by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.get('/:id', authMiddleware, companyController.getCompanyById);

/**
 * @swagger
 * /api/company/{id}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Updated company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.put('/:id', authMiddleware, adminMiddleware, companyController.updateCompany);

/**
 * @swagger
 * /api/company/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete a company by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company deleted successfully"
 */
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany);

export default router;
