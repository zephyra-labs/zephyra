/**
 * @file userCompanyRoutes.ts
 * @description Routes for managing user-company relationships and company profiles
 */

import { Router } from "express";
import { UserCompanyController } from "../controllers/userCompanyController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * --- User Company Routes ---
 * Manage user-company relationships and company profiles
 */

/**
 * Create a new user-company record
 * @route POST /user-companies
 * @group UserCompany
 * @security BearerAuth
 * @param {object} body - UserCompany payload
 * @returns {object} 201 - Created user-company record
 * @returns {Error} 400 - Validation error
 */
router.post("/", authMiddleware, UserCompanyController.create);

/**
 * Get all user-company records
 * @route GET /user-companies
 * @group UserCompany
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of user-company records
 */
router.get("/", authMiddleware, UserCompanyController.getAll);

/**
 * Get company records by user wallet address
 * @route GET /user-companies/user/:address
 * @group UserCompany
 * @security BearerAuth
 * @param {string} address.path.required - User wallet address
 * @returns {Array<object>} 200 - User-company records for the user
 */
router.get("/user/:address", authMiddleware, UserCompanyController.getByUser);

/**
 * Get users associated with a specific company
 * @route GET /user-companies/company/:companyId
 * @group UserCompany
 * @security BearerAuth
 * @param {string} companyId.path.required - Company ID
 * @returns {Array<object>} 200 - Users associated with the company
 */
router.get("/company/:companyId", authMiddleware, UserCompanyController.getByCompany);

/**
 * Get the company profile of the currently logged-in user
 * @route GET /user-companies/my-company
 * @group UserCompany
 * @security BearerAuth
 * @returns {object} 200 - Company profile of the current user
 */
router.get("/my-company", authMiddleware, UserCompanyController.getMyCompany);

/**
 * Update the company profile of the currently logged-in user
 * @route PUT /user-companies/my-company
 * @group UserCompany
 * @security BearerAuth
 * @param {object} body - Partial company update payload
 * @returns {object} 200 - Updated company profile
 * @returns {Error} 400 - Validation error
 */
router.put("/my-company", authMiddleware, UserCompanyController.updateMyCompany);

/**
 * Get a user-company record by its ID
 * @route GET /user-companies/:id
 * @group UserCompany
 * @security BearerAuth
 * @param {string} id.path.required - UserCompany record ID
 * @returns {object} 200 - User-company record
 * @returns {Error} 404 - Record not found
 */
router.get("/:id", authMiddleware, UserCompanyController.getById);

/**
 * Update a user-company record (admin only)
 * @route PUT /user-companies/:id
 * @group UserCompany
 * @security BearerAuth
 * @access Admin only
 * @param {string} id.path.required - UserCompany record ID
 * @param {object} body - Partial update payload
 * @returns {object} 200 - Updated record
 * @returns {Error} 404 - Record not found
 */
router.put("/:id", authMiddleware, adminMiddleware, UserCompanyController.update);

/**
 * Delete a user-company record (admin only)
 * @route DELETE /user-companies/:id
 * @group UserCompany
 * @security BearerAuth
 * @access Admin only
 * @param {string} id.path.required - UserCompany record ID
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - Record not found
 */
router.delete("/:id", authMiddleware, adminMiddleware, UserCompanyController.delete);

export default router;
