import { Router } from "express"
import { DashboardController } from "../controllers/dashboardController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js" 
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router()

// --- Admin dashboard (misal hanya superuser) ---
router.get("/admin", authMiddleware, adminMiddleware, DashboardController.getDashboard)

// --- User dashboard ---
router.get("/user", authMiddleware, DashboardController.getUserDashboard)

export default router
