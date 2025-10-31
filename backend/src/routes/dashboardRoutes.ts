import { Router } from "express"
import { DashboardController } from "../controllers/dashboardController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router()

/**
 * --- Dashboard Routes ---
 * Provide aggregated system data and insights for users and admins.
 * Includes endpoints for both admin and user dashboards.
 */

/**
 * GET /dashboard/admin
 * Retrieve system-wide analytics and summary data.
 * Accessible only by admin or superuser.
 */
router.get("/admin", authMiddleware, adminMiddleware, DashboardController.getDashboard)

/**
 * GET /dashboard/user
 * Retrieve personalized dashboard data for the authenticated user.
 */
router.get("/user", authMiddleware, DashboardController.getUserDashboard)

export default router
