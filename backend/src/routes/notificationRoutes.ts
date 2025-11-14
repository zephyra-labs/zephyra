/**
 * @file notificationRoutes.ts
 * @description Express router for notifications with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";

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
 *     NotificationDTO:
 *       type: object
 *       required:
 *         - userId
 *         - executorId
 *         - type
 *         - title
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           example: "notif-uuid-123"
 *         userId:
 *           type: string
 *           example: "user-uuid-456"
 *         executorId:
 *           type: string
 *           example: "user-uuid-789"
 *         type:
 *           type: string
 *           enum: ["kyc", "document", "transaction", "system", "agreement", "user", "user_company"]
 *           example: "system"
 *         title:
 *           type: string
 *           example: "New Trade Completed"
 *         message:
 *           type: string
 *           example: "Your trade #123 has been completed successfully."
 *         read:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *         extraData:
 *           type: object
 *           additionalProperties: true
 *
 * tags:
 *   - name: Notification
 *     description: Endpoints to manage notifications
 */

/**
 * @swagger
 * /api/notification:
 *   get:
 *     tags: [Notification]
 *     summary: Get all notifications
 *     description: Retrieve a list of all notifications for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationDTO'
 *             example:
 *               - id: "notif-uuid-123"
 *                 userId: "user-uuid-456"
 *                 executorId: "user-uuid-789"
 *                 type: "system"
 *                 title: "New Trade Completed"
 *                 message: "Your trade #123 has been completed successfully."
 *                 read: false
 *                 createdAt: 1699286400000
 *                 updatedAt: 1699372800000
 *                 extraData:
 *                   tradeId: 123
 *       401:
 *         description: Unauthorized — invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       500:
 *         description: Server error while fetching notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch notifications"
 */
router.get("/", authMiddleware, NotificationController.getAll);

/**
 * @swagger
 * /api/notification/user/{userId}:
 *   get:
 *     tags: [Notification]
 *     summary: Get notifications for a specific user
 *     description: Retrieve a list of notifications for the specified user ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of notifications for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationDTO'
 *             examples:
 *               success:
 *                 summary: Example list of notifications
 *                 value:
 *                   - id: "notif-uuid-123"
 *                     userId: "user-uuid-456"
 *                     executorId: "user-uuid-789"
 *                     type: "kyc"
 *                     title: "KYC Approved"
 *                     message: "Your KYC request has been approved."
 *                     read: false
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *                     extraData:
 *                       kycId: "kyc-uuid-123"
 *                   - id: "notif-uuid-124"
 *                     userId: "user-uuid-456"
 *                     executorId: "system"
 *                     type: "system"
 *                     title: "System Update"
 *                     message: "Maintenance scheduled at 2 AM."
 *                     read: true
 *                     createdAt: 1699380000000
 *                     updatedAt: 1699383600000
 *                     extraData: {}
 *
 *       400:
 *         description: Bad request — missing userId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing userId parameter"
 *
 *       401:
 *         description: Unauthorized — invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: No notifications found for this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No notifications found for user"
 *
 *       500:
 *         description: Server error while fetching user notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch user notifications"
 */
router.get("/user/:userId", authMiddleware, NotificationController.getByUser);

/**
 * @swagger
 * /api/notification/{id}:
 *   get:
 *     tags: [Notification]
 *     summary: Get a single notification by ID
 *     description: Retrieve a notification by its unique ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationDTO'
 *             examples:
 *               success:
 *                 summary: Example notification
 *                 value:
 *                   id: "notif-uuid-123"
 *                   userId: "user-uuid-456"
 *                   executorId: "user-uuid-789"
 *                   type: "system"
 *                   title: "New Trade Completed"
 *                   message: "Your trade #123 has been completed successfully."
 *                   read: false
 *                   createdAt: 1699286400000
 *                   updatedAt: 1699372800000
 *                   extraData:
 *                     tradeId: "trade-uuid-987"
 *
 *       400:
 *         description: Bad request — missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing id parameter"
 *
 *       401:
 *         description: Unauthorized — invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Notification not found"
 *
 *       500:
 *         description: Server error while fetching notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch notification"
 */
router.get("/:id", authMiddleware, NotificationController.getById);

/**
 * @swagger
 * /api/notification/{id}/read:
 *   patch:
 *     tags: [Notification]
 *     summary: Mark a notification as read
 *     description: Updates the notification's `read` status to `true`. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *             examples:
 *               success:
 *                 summary: Example success response
 *                 value:
 *                   message: "Notification marked as read"
 *
 *       400:
 *         description: Bad request — missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing id parameter"
 *
 *       401:
 *         description: Unauthorized — invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Notification not found"
 *
 *       500:
 *         description: Server error while marking notification as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to mark notification as read"
 */
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead);

/**
 * @swagger
 * /api/notification/{id}:
 *   delete:
 *     tags: [Notification]
 *     summary: Delete a specific notification
 *     description: Deletes a notification by its ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification deleted successfully"
 *             examples:
 *               success:
 *                 summary: Example success response
 *                 value:
 *                   message: "Notification deleted successfully"
 *
 *       400:
 *         description: Bad request — missing ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing id parameter"
 *
 *       401:
 *         description: Unauthorized — invalid or missing bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Notification not found"
 *
 *       500:
 *         description: Server error while deleting notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete notification"
 */
router.delete("/:id", authMiddleware, NotificationController.delete);

/**
 * @swagger
 * /api/notification/internal:
 *   post:
 *     tags: [Notification]
 *     summary: Internal route to create notification (system use)
 *     description: Used internally by the system to create a notification for a user.
 *     security:
 *       - internalBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID
 *               executorId:
 *                 type: string
 *                 description: User ID who triggers the notification (default: "system")
 *               type:
 *                 type: string
 *                 enum: ["kyc", "document", "transaction", "system", "agreement", "user", "user_company"]
 *                 description: Notification type
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               extraData:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Additional optional data
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationDTO'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing required fields"
 *       401:
 *         description: Unauthorized — Invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal authentication failed"
 *       500:
 *         description: Server error while creating notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to create notification"
 */
router.post("/internal", internalAuthMiddleware, NotificationController.createInternal);

export default router;
