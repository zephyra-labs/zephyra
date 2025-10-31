import { Router } from "express"
import { UserCompanyController } from "../controllers/userCompanyController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router();

/**
 * --- User Company Routes ---
 * Manage user-company relationships and company profiles
 */

/**
 * POST /user-companies
 * Create a new user-company record (authenticated)
 */
router.post("/", authMiddleware, UserCompanyController.create);

/**
 * GET /user-companies
 * Get all user-company records (authenticated)
 */
router.get("/", authMiddleware, UserCompanyController.getAll);

/**
 * GET /user-companies/user/:address
 * Get company records by user wallet address
 */
router.get("/user/:address", authMiddleware, UserCompanyController.getByUser);

/**
 * GET /user-companies/company/:companyId
 * Get users associated with a specific company
 */
router.get("/company/:companyId", authMiddleware, UserCompanyController.getByCompany);

/**
 * GET /user-companies/my-company
 * Get the company profile of the currently logged-in user
 */
router.get("/my-company", authMiddleware, UserCompanyController.getMyCompany);

/**
 * PUT /user-companies/my-company
 * Update the company profile of the currently logged-in user
 */
router.put("/my-company", authMiddleware, UserCompanyController.updateMyCompany);

/**
 * GET /user-companies/:id
 * Get a user-company record by its ID
 */
router.get("/:id", authMiddleware, UserCompanyController.getById);

/**
 * PUT /user-companies/:id
 * Update a user-company record (admin only)
 */
router.put("/:id", authMiddleware, adminMiddleware, UserCompanyController.update);

/**
 * DELETE /user-companies/:id
 * Delete a user-company record (admin only)
 */
router.delete("/:id", authMiddleware, adminMiddleware, UserCompanyController.delete);

export default router;
