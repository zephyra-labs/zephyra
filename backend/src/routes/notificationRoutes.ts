import { Router } from "express"
import { NotificationController } from "../controllers/notificationController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware.js"

const router = Router();

/**
 * --- Notification Routes ---
 * Manage user notifications (read, list, delete) and internal notification creation
 */

/**
 * GET /notifications
 * Get all notifications (admin or authorized user)
 */
router.get("/", authMiddleware, NotificationController.getAll);

/**
 * GET /notifications/user/:userId
 * Get all notifications belonging to a specific user
 */
router.get("/user/:userId", authMiddleware, NotificationController.getByUser);

/**
 * GET /notifications/:id
 * Get a single notification by its ID
 */
router.get("/:id", authMiddleware, NotificationController.getById);

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read
 */
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead);

/**
 * DELETE /notifications/:id
 * Delete a specific notification
 */
router.delete("/:id", authMiddleware, NotificationController.delete);

/**
 * POST /notifications/internal
 * Internal route: Create notification (used by system services)
 */
router.post("/internal", internalAuthMiddleware, NotificationController.createInternal);

export default router;
