/**
 * @file dashboardRoutes.ts
 * @description Routes for fetching dashboard data for admins and users.
 * Provides aggregated metrics, summaries, and user-specific insights.
 */

import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = Router();

/**
 * Get system-wide dashboard data (Admin only)
 * @route GET /dashboard/admin
 * @group Dashboard
 * @security BearerAuth
 * @returns {object} 200 - Admin dashboard metrics
 */
router.get("/admin", authMiddleware, adminMiddleware, DashboardController.getDashboard);

/**
 * Get personalized dashboard data for authenticated user
 * @route GET /dashboard/user
 * @group Dashboard
 * @security BearerAuth
 * @returns {object} 200 - User dashboard metrics
 */
router.get("/user", authMiddleware, DashboardController.getUserDashboard);

export default router;
