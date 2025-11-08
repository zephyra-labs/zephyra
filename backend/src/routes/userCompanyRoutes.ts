/**
 * @file userCompanyRoutes.ts
 * @description Routes for managing user-company relationships with full Swagger/OpenAPI 3 documentation
 */

import { Router } from "express";
import { UserCompanyController } from "../controllers/userCompanyController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserCompanyDTO:
 *       type: object
 *       required:
 *         - userAddress
 *         - companyId
 *         - joinedAt
 *       properties:
 *         userAddress:
 *           type: string
 *           example: "0x123abc..."
 *         companyId:
 *           type: string
 *           example: "company_01"
 *         role:
 *           type: string
 *           enum: [owner, admin, manager, staff, viewer]
 *           example: staff
 *         status:
 *           type: string
 *           enum: [pending, active, rejected]
 *           example: pending
 *         txHash:
 *           type: string
 *           example: "0xabc123..."
 *         joinedAt:
 *           type: integer
 *           example: 1699286400000
 *         onchainJoinedAt:
 *           type: integer
 *
 *     UpdateUserCompanyDTO:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [owner, admin, manager, staff, viewer]
 *         status:
 *           type: string
 *           enum: [pending, active, rejected]
 *         txHash:
 *           type: string
 *         updatedAt:
 *           type: integer
 *         onchainJoinedAt:
 *           type: integer
 *
 *     UserCompanyDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userAddress:
 *           type: string
 *         companyId:
 *           type: string
 *         role:
 *           type: string
 *           enum: [owner, admin, manager, staff, viewer]
 *         status:
 *           type: string
 *           enum: [pending, active, rejected]
 *         joinedAt:
 *           type: integer
 *         updatedAt:
 *           type: integer
 *         txHash:
 *           type: string
 *         onchainJoinedAt:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   - name: UserCompany
 *     description: User-company relationship endpoints
 */

/**
 * Create a new user-company relation
 * @swagger
 * /api/user-company:
 *   post:
 *     tags:
 *       - UserCompany
 *     summary: Create a new user-company record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserCompanyDTO'
 *     responses:
 *       201:
 *         description: Created user-company record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCompanyDTO'
 *       400:
 *         description: Validation error
 */
router.post("/", authMiddleware, UserCompanyController.create);

/**
 * Get all user-company relations with optional filters
 * @swagger
 * /api/user-company:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get all user-company records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user-company records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserCompanyDTO'
 *                 total:
 *                   type: integer
 */
router.get("/", authMiddleware, UserCompanyController.getAll);

/**
 * Get all user-company records for a specific user
 * @swagger
 * /api/user-company/user/{address}:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get company records by user wallet address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user-company records for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserCompanyDTO'
 */
router.get("/user/:address", authMiddleware, UserCompanyController.getByUser);

/**
 * Get all users associated with a company
 * @swagger
 * /api/user-company/company/{companyId}:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get users associated with a specific company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user-company records for the company
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserCompanyDTO'
 */
router.get("/company/:companyId", authMiddleware, UserCompanyController.getByCompany);

/**
 * Get the company profile of the currently logged-in user
 * @swagger
 * /api/user-company/my-company:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get the company profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile of current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/my-company", authMiddleware, UserCompanyController.getMyCompany);

/**
 * Update the company profile of the currently logged-in user
 * @swagger
 * /api/user-company/my-company:
 *   put:
 *     tags:
 *       - UserCompany
 *     summary: Update the company profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserCompanyDTO'
 *     responses:
 *       200:
 *         description: Updated company profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put("/my-company", authMiddleware, UserCompanyController.updateMyCompany);

/**
 * Get a user-company record by ID
 * @swagger
 * /api/user-company/{id}:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get a user-company record by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User-company record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCompanyDTO'
 */
router.get("/:id", authMiddleware, UserCompanyController.getById);

/**
 * Update a user-company record (admin only)
 * @swagger
 * /api/user-company/{id}:
 *   put:
 *     tags:
 *       - UserCompany
 *     summary: Update a user-company record (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserCompanyDTO'
 *     responses:
 *       200:
 *         description: Updated user-company record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCompanyDTO'
 */
router.put("/:id", authMiddleware, adminMiddleware, UserCompanyController.update);

/**
 * Delete a user-company record (admin only)
 * @swagger
 * /api/user-company/{id}:
 *   delete:
 *     tags:
 *       - UserCompany
 *     summary: Delete a user-company record (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                   example: "Relation deleted successfully"
 */
router.delete("/:id", authMiddleware, adminMiddleware, UserCompanyController.delete);

export default router;
