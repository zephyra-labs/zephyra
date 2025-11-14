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
 *
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
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserCompanyDTO'
 *           example:
 *             userAddress: "0x123abc..."
 *             companyId: "company_01"
 *             role: "staff"
 *             status: "pending"
 *             txHash: "0xabc123..."
 *             joinedAt: 1699286400000
 *             onchainJoinedAt: 1699286500000
 *
 *     responses:
 *       201:
 *         description: User-company record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCompanyDTO'
 *             example:
 *               success: true
 *               data:
 *                 id: "uc_001"
 *                 userAddress: "0x123abc..."
 *                 companyId: "company_01"
 *                 role: "staff"
 *                 status: "pending"
 *                 txHash: "0xabc123..."
 *                 joinedAt: 1699286400000
 *                 updatedAt: 1699286400000
 *                 onchainJoinedAt: 1699286500000
 *
 *       400:
 *         description: Validation error — Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid request body"
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
 *         description: Server error — Failed to create user-company relation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create user-company relation"
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
 *         example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "0x12ab"
 *         description: Search by userAddress or companyId
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [owner, admin, manager, staff, viewer]
 *         example: admin
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, rejected]
 *         example: active
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         example: "company_01"
 *         description: Filter by company ID
 *     responses:
 *       200:
 *         description: List of user-company records
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
 *                     $ref: '#/components/schemas/UserCompanyDTO'
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *             example:
 *               success: true
 *               data:
 *                 - id: "uc-uuid-123"
 *                   userAddress: "0x123abc..."
 *                   companyId: "company_01"
 *                   role: "admin"
 *                   status: "active"
 *                   joinedAt: 1699286400000
 *                   updatedAt: 1699372800000
 *                   txHash: "0xabc123..."
 *                   onchainJoinedAt: 1699286500000
 *                 - id: "uc-uuid-124"
 *                   userAddress: "0x456def..."
 *                   companyId: "company_01"
 *                   role: "staff"
 *                   status: "pending"
 *                   joinedAt: 1699286600000
 *                   updatedAt: 1699372900000
 *                   txHash: "0xdef456..."
 *                   onchainJoinedAt: 1699286700000
 *               total: 2
 *               page: 1
 *               limit: 10
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid query parameter: page must be a number"
 *       401:
 *         description: Unauthorized — Invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       500:
 *         description: Server error while fetching records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user-company relations"
 */
router.get("/", authMiddleware, UserCompanyController.getAll);

/**
 * Get all user-company records for a specific user
 * @swagger
 * /api/user-company/user/{address}:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get all company relations for a specific user
 *     description: Fetch all user-company records associated with a given wallet address.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: User wallet address
 *         example: "0x123abc..."
 *     responses:
 *       200:
 *         description: List of user-company records for the user
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
 *                     $ref: '#/components/schemas/UserCompanyDTO'
 *             example:
 *               success: true
 *               data:
 *                 - id: "uc-uuid-123"
 *                   userAddress: "0x123abc..."
 *                   companyId: "company_01"
 *                   role: "admin"
 *                   status: "active"
 *                   joinedAt: 1699286400000
 *                   updatedAt: 1699372800000
 *                   txHash: "0xabc123..."
 *                   onchainJoinedAt: 1699286500000
 *                 - id: "uc-uuid-124"
 *                   userAddress: "0x123abc..."
 *                   companyId: "company_02"
 *                   role: "staff"
 *                   status: "pending"
 *                   joinedAt: 1699286600000
 *                   updatedAt: 1699372900000
 *                   txHash: "0xdef456..."
 *                   onchainJoinedAt: 1699286700000
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
 *         description: No relations found for the specified user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No relations found for user"
 *
 *       422:
 *         description: Validation error — Missing user address parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing user address"
 *
 *       500:
 *         description: Server error while fetching user relations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user relations"
 */
router.get("/user/:address", authMiddleware, UserCompanyController.getByUser);

/**
 * Get all users associated with a company
 * @swagger
 * /api/user-company/company/{companyId}:
 *   get:
 *     tags:
 *       - UserCompany
 *     summary: Get all users associated with a specific company
 *     description: Fetch all user-company records for a given company ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: "company_01"
 *     responses:
 *       200:
 *         description: List of user-company records for the company
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
 *                     $ref: '#/components/schemas/UserCompanyDTO'
 *             example:
 *               success: true
 *               data:
 *                 - id: "uc-uuid-123"
 *                   userAddress: "0x123abc..."
 *                   companyId: "company_01"
 *                   role: "admin"
 *                   status: "active"
 *                   joinedAt: 1699286400000
 *                   updatedAt: 1699372800000
 *                   txHash: "0xabc123..."
 *                   onchainJoinedAt: 1699286500000
 *                 - id: "uc-uuid-124"
 *                   userAddress: "0x456def..."
 *                   companyId: "company_01"
 *                   role: "staff"
 *                   status: "pending"
 *                   joinedAt: 1699286600000
 *                   updatedAt: 1699372900000
 *                   txHash: "0xdef456..."
 *                   onchainJoinedAt: 1699286700000
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
 *         description: No relations found for the specified company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No relations found for company"
 *
 *       422:
 *         description: Validation error — Missing companyId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing companyId parameter"
 *
 *       500:
 *         description: Server error while fetching company relations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch company relations"
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
 *     description: Fetch the company associated with the currently logged-in user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompanyDTO'
 *             example:
 *               success: true
 *               data:
 *                 id: "company_01"
 *                 name: "Example Company"
 *                 address: "123 Blockchain St."
 *                 website: "https://example.com"
 *                 status: "active"
 *                 createdAt: 1699286400000
 *                 updatedAt: 1699372800000
 *
 *       401:
 *         description: Unauthorized — user not logged in or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: No company relation found or company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noRelation:
 *                 value:
 *                   success: false
 *                   message: "No company relation found"
 *               noCompany:
 *                 value:
 *                   success: false
 *                   message: "Company not found"
 *
 *       500:
 *         description: Server error while fetching user's company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user's company"
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
 *           example:
 *             role: "admin"
 *             status: "active"
 *             txHash: "0xabc123..."
 *             updatedAt: 1699372800000
 *             onchainJoinedAt: 1699286500000
 *     responses:
 *       200:
 *         description: Updated company profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCompanyDTO'
 *             example:
 *               success: true
 *               data:
 *                 id: "uc-uuid-123"
 *                 userAddress: "0x123abc..."
 *                 companyId: "company_01"
 *                 role: "admin"
 *                 status: "active"
 *                 joinedAt: 1699286400000
 *                 updatedAt: 1699372800000
 *                 txHash: "0xabc123..."
 *                 onchainJoinedAt: 1699286500000
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid input data"
 *
 *       401:
 *         description: Unauthorized — user not logged in or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *
 *       403:
 *         description: Forbidden — user is not owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Only company owner can update company data"
 *
 *       404:
 *         description: User relation or company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noRelation:
 *                 value:
 *                   success: false
 *                   message: "User is not linked to any company"
 *               noCompany:
 *                 value:
 *                   success: false
 *                   message: "Company not found"
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
router.put("/my-company", authMiddleware, UserCompanyController.updateMyCompany);

/**
 * @swagger
 * /api/user-company/{id}:
 *   get:
 *     tags: [UserCompany]
 *     summary: Get a user-company record by its ID
 *     description: Retrieve details of a specific user-company relationship by its unique ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User-company record ID
 *         example: "uc-uuid-123"
 *     responses:
 *       200:
 *         description: User-company record fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCompanyDTO'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "uc-uuid-123"
 *                     userAddress: "0x123abc..."
 *                     companyId: "company_01"
 *                     role: "staff"
 *                     status: "active"
 *                     joinedAt: 1699286400000
 *                     updatedAt: 1699372800000
 *                     txHash: "0xabc123..."
 *                     onchainJoinedAt: 1699286500000
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Example unauthorized response
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: User-company record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Example not found response
 *                 value:
 *                   success: false
 *                   message: "Relation not found"
 *
 *       422:
 *         description: Missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Example missing ID response
 *                 value:
 *                   success: false
 *                   message: "Missing id parameter"
 *
 *       500:
 *         description: Server error while fetching user-company record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Example server error response
 *                 value:
 *                   success: false
 *                   message: "Failed to fetch relation"
 */
router.get("/:id", authMiddleware, UserCompanyController.getById);

/**
 * @swagger
 * /api/user-company/{id}:
 *   put:
 *     tags: [UserCompany]
 *     summary: Update a user-company record (admin only)
 *     description: Update the details of a user-company record. Only accessible by admin users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User-company record ID
 *         example: "uc-uuid-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserCompanyDTO'
 *           example:
 *             role: "admin"
 *             status: "active"
 *     responses:
 *       200:
 *         description: User-company record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCompanyDTO'
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "uc-uuid-123"
 *                     userAddress: "0x123abc..."
 *                     companyId: "company_01"
 *                     role: "admin"
 *                     status: "active"
 *                     joinedAt: 1699286400000
 *                     updatedAt: 1699372800000
 *                     txHash: "0xabc123..."
 *                     onchainJoinedAt: 1699286500000
 *
 *       400:
 *         description: Validation or update error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 summary: Example validation error response
 *                 value:
 *                   success: false
 *                   message: "Failed to update relation"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Example unauthorized response
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       403:
 *         description: Forbidden — User is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               forbidden:
 *                 summary: Example forbidden response
 *                 value:
 *                   success: false
 *                   message: "Access denied. Admins only."
 *
 *       404:
 *         description: User-company record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Example not found response
 *                 value:
 *                   success: false
 *                   message: "Relation not found"
 *
 *       422:
 *         description: Missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Example missing ID response
 *                 value:
 *                   success: false
 *                   message: "Missing id parameter"
 *
 *       500:
 *         description: Server error while updating relation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Example server error response
 *                 value:
 *                   success: false
 *                   message: "Failed to update relation"
 */
router.put("/:id", authMiddleware, adminMiddleware, UserCompanyController.update);

/**
 * @swagger
 * /api/user-company/{id}:
 *   delete:
 *     tags: [UserCompany]
 *     summary: Delete a user-company record (admin only)
 *     description: Delete a specific user-company relation. Only accessible by admin users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User-company record ID
 *         example: "uc-uuid-123"
 *     responses:
 *       200:
 *         description: Relation deleted successfully
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
 *                       example: "Relation deleted successfully"
 *             examples:
 *               success:
 *                 summary: Example successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     message: "Relation deleted successfully"
 *
 *       400:
 *         description: Validation or deletion error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               badRequest:
 *                 summary: Example validation/deletion error
 *                 value:
 *                   success: false
 *                   message: "Failed to delete relation"
 *
 *       401:
 *         description: Unauthorized — Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Example unauthorized response
 *                 value:
 *                   success: false
 *                   message: "Missing or invalid Authorization header"
 *
 *       403:
 *         description: Forbidden — User is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               forbidden:
 *                 summary: Example forbidden response
 *                 value:
 *                   success: false
 *                   message: "Access denied. Admins only."
 *
 *       404:
 *         description: Relation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 summary: Example not found response
 *                 value:
 *                   success: false
 *                   message: "Relation not found"
 *
 *       422:
 *         description: Missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingId:
 *                 summary: Example missing ID response
 *                 value:
 *                   success: false
 *                   message: "Missing id parameter"
 *
 *       500:
 *         description: Server error while deleting relation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 summary: Example server error response
 *                 value:
 *                   success: false
 *                   message: "Failed to delete relation"
 */
router.delete("/:id", authMiddleware, adminMiddleware, UserCompanyController.delete);

export default router;
