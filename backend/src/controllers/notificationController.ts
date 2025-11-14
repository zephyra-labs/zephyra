/**
 * @file notificationController.ts
 * @description Express controller for managing notifications.
 */

import type { Request, Response } from "express";
import { NotificationModel } from "../models/notificationModel";
import { NotificationService } from "../services/notificationService";
import { success, failure, handleError } from "../utils/responseHelper";

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
      return handleError(res, err, "Failed to create notification", 500);
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
      return success(res, notifications, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch notifications", 500);
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
      if (!userId) return failure(res, "Missing userId parameter", 422);

      const notifications = await NotificationModel.getByUser(userId);
      if (!notifications.length) return failure(res, "No notifications found for user", 404);

      return success(res, notifications, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch user notifications", 500);
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
      if (!id) return failure(res, "Missing id parameter", 422);

      const notification = await NotificationModel.getById(id);
      if (!notification) return failure(res, "Notification not found", 404);

      return success(res, notification, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch notification", 500);
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
      if (!id) return failure(res, "Missing id parameter", 422);

      const result = await NotificationModel.markAsRead(id);
      if (!result) return failure(res, "Notification not found", 404);

      return success(res, { message: "Notification marked as read" }, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to mark notification as read", 500);
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
      if (!id) return failure(res, "Missing id parameter", 422);

      const result = await NotificationModel.delete(id);
      if (!result) return failure(res, "Notification not found", 404);

      return success(res, { message: "Notification deleted successfully" }, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to delete notification", 500);
    }
  }
}
