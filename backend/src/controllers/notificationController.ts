/**
 * @file notificationController.ts
 * @description Express controller for managing notifications.
 */

import type { Request, Response } from "express";
import { NotificationModel } from "../models/notificationModel.js";
import { NotificationService } from "../services/notificationService.js";
import { success, failure, handleError } from "../utils/responseHelper.js";

/**
 * Notification controller
 */
export class NotificationController {
  /**
   * Create internal notification (for system or other services).
   * POST /notifications/internal
   *
   * @param {Request} req
   * @param {Response} res
   */
  static async createInternal(req: Request, res: Response) {
    try {
      let { userId, executorId } = req.body;
      const { type, title, message, extraData } = req.body;

      if (!userId || !type || !title || !message) {
        return failure(res, "Missing required fields", 400);
      }

      userId = userId;
      if (executorId) executorId = executorId;

      const notif = await NotificationService.notify(
        userId,
        executorId ?? "system",
        type,
        title,
        message,
        extraData
      );

      return success(res, notif, 201);
    } catch (err) {
      return handleError(res, err, "Failed to create notification");
    }
  }

  /**
   * Get all notifications.
   * GET /notifications
   *
   * @param {Request} _req
   * @param {Response} res
   */
  static async getAll(_req: Request, res: Response) {
    try {
      const notifications = await NotificationModel.getAll();
      return success(res, notifications);
    } catch (err) {
      return handleError(res, err, "Failed to fetch notifications");
    }
  }

  /**
   * Get notifications by user.
   * GET /notifications/user/:userId
   *
   * @param {Request} req
   * @param {Response} res
   */
  static async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) return failure(res, "userId is required", 400);

      const notifications = await NotificationModel.getByUser(userId);
      return success(res, notifications);
    } catch (err) {
      return handleError(res, err, "Failed to fetch user notifications");
    }
  }

  /**
   * Get notification by ID.
   * GET /notifications/:id
   *
   * @param {Request} req
   * @param {Response} res
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const notification = await NotificationModel.getById(id);
      if (!notification) return failure(res, "Notification not found", 404);

      return success(res, notification);
    } catch (err) {
      return handleError(res, err, "Failed to fetch notification");
    }
  }

  /**
   * Mark a notification as read.
   * PATCH /notifications/:id/read
   *
   * @param {Request} req
   * @param {Response} res
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await NotificationModel.markAsRead(id);
      if (!result) return failure(res, "Notification not found", 404);

      return success(res, { message: "Notification marked as read" });
    } catch (err) {
      return handleError(res, err, "Failed to mark notification as read");
    }
  }

  /**
   * Delete a notification.
   * DELETE /notifications/:id
   *
   * @param {Request} req
   * @param {Response} res
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await NotificationModel.delete(id);
      if (!result) return failure(res, "Notification not found", 404);

      return success(res, { message: "Notification deleted successfully" });
    } catch (err) {
      return handleError(res, err, "Failed to delete notification");
    }
  }
}
