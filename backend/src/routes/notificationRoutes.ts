/**
 * @file notificationRoutes.ts
 * @description Routes for managing user notifications and internal notification creation
 */

import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";

const router = Router();

/**
 * --- Notification Routes ---
 * Manage user notifications (read, list, delete) and internal notification creation
 */

/**
 * Get all notifications
 * @route GET /notifications
 * @group Notification
 * @security BearerAuth
 * @returns {Array<object>} 200 - List of all notifications
 */
router.get("/", authMiddleware, NotificationController.getAll);

/**
 * Get notifications for a specific user
 * @route GET /notifications/user/:userId
 * @group Notification
 * @security BearerAuth
 * @param {string} userId.path.required - User ID
 * @returns {Array<object>} 200 - List of notifications for the user
 */
router.get("/user/:userId", authMiddleware, NotificationController.getByUser);

/**
 * Get a single notification by ID
 * @route GET /notifications/:id
 * @group Notification
 * @security BearerAuth
 * @param {string} id.path.required - Notification ID
 * @returns {object} 200 - Notification data
 * @returns {Error} 404 - Notification not found
 */
router.get("/:id", authMiddleware, NotificationController.getById);

/**
 * Mark a notification as read
 * @route PATCH /notifications/:id/read
 * @group Notification
 * @security BearerAuth
 * @param {string} id.path.required - Notification ID
 * @returns {object} 200 - Updated notification with read status
 */
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead);

/**
 * Delete a specific notification
 * @route DELETE /notifications/:id
 * @group Notification
 * @security BearerAuth
 * @param {string} id.path.required - Notification ID
 * @returns {object} 200 - Success message
 */
router.delete("/:id", authMiddleware, NotificationController.delete);

/**
 * Internal route: Create notification (used by system services)
 * @route POST /notifications/internal
 * @group Notification
 * @security InternalBearerAuth
 * @param {object} body - Notification payload
 * @returns {object} 201 - Created notification
 */
router.post("/internal", internalAuthMiddleware, NotificationController.createInternal);

export default router;
