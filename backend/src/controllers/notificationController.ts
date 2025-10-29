import { Request, Response } from "express"
import { NotificationModel } from "../models/notificationModel.js"
import { NotificationService } from "../services/notificationService.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

export class NotificationController {
  // --- Create Notification (Internal Use) ---
  static async createInternal(req: Request, res: Response) {
    try {
      let { userId, executorId } = req.body
      const { type, title, message, extraData } = req.body

      if (!userId || !type || !title || !message) {
        return failure(res, "Missing required fields", 400)
      }

      userId = userId.toLowerCase()
      if (executorId) executorId = executorId.toLowerCase()

      const notif = await NotificationService.notify(
        userId,
        executorId ?? "system",
        type,
        title,
        message,
        extraData
      )

      return success(res, notif, 201)
    } catch (err) {
      return handleError(res, err, "Failed to create notification")
    }
  }

  // --- Get All Notifications ---
  static async getAll(_req: Request, res: Response) {
    try {
      const notifications = await NotificationModel.getAll()
      return success(res, notifications)
    } catch (err) {
      return handleError(res, err, "Failed to fetch notifications")
    }
  }

  // --- Get Notifications by User ---
  static async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      if (!userId) return failure(res, "userId is required", 400)

      const notifications = await NotificationModel.getByUser(userId)
      return success(res, notifications)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user notifications")
    }
  }

  // --- Get Notification by Id ---
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationModel.getById(id)
      if (!notification) return failure(res, "Notification not found", 404)

      return success(res, notification)
    } catch (err) {
      return handleError(res, err, "Failed to fetch notification")
    }
  }

  // --- Mark Notification as Read ---
  static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const result = await NotificationModel.markAsRead(id)
      if (!result) return failure(res, "Notification not found", 404)

      return success(res, { message: "Notification marked as read" })
    } catch (err) {
      return handleError(res, err, "Failed to mark notification as read")
    }
  }

  // --- Delete Notification ---
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const result = await NotificationModel.delete(id)
      if (!result) return failure(res, "Notification not found", 404)

      return success(res, { message: "Notification deleted successfully" })
    } catch (err) {
      return handleError(res, err, "Failed to delete notification")
    }
  }
}
