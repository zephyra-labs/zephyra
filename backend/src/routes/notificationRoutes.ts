import { Router } from "express"
import { NotificationController } from "../controllers/notificationController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware.js"

const router = Router()

// --- Get All Notifications ---
router.get("/", authMiddleware, NotificationController.getAll)

// --- Get Notifications by User ---
router.get("/user/:userId", authMiddleware, NotificationController.getByUser)

// --- Get Notification by Id ---
router.get("/:id", authMiddleware, NotificationController.getById)

// --- Mark Notification as Read ---
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead)

// --- Delete Notification ---
router.delete("/:id", authMiddleware, NotificationController.delete)

// --- Internal: Create Notification ---
router.post("/internal", internalAuthMiddleware, NotificationController.createInternal)

export default router
