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
 */
router.get("/", authMiddleware, NotificationController.getAll);

/**
 * @swagger
 * /api/notification/user/{userId}:
 *   get:
 *     tags: [Notification]
 *     summary: Get notifications for a specific user
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
 */
router.get("/user/:userId", authMiddleware, NotificationController.getByUser);

/**
 * @swagger
 * /api/notification/{id}:
 *   get:
 *     tags: [Notification]
 *     summary: Get a single notification by ID
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
 *         description: Notification data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationDTO'
 *       404:
 *         description: Notification not found
 */
router.get("/:id", authMiddleware, NotificationController.getById);

/**
 * @swagger
 * /api/notification/{id}/read:
 *   patch:
 *     tags: [Notification]
 *     summary: Mark a notification as read
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
 *         description: Updated notification with read status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationDTO'
 */
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead);

/**
 * @swagger
 * /api/notification/{id}:
 *   delete:
 *     tags: [Notification]
 *     summary: Delete a specific notification
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
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification deleted
 */
router.delete("/:id", authMiddleware, NotificationController.delete);

/**
 * @swagger
 * /api/notification/internal:
 *   post:
 *     tags: [Notification]
 *     summary: Internal route to create notification (system use)
 *     security:
 *       - internalBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationDTO'
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationDTO'
 */
router.post("/internal", internalAuthMiddleware, NotificationController.createInternal);

export default router;
