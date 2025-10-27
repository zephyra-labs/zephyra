import { Request, Response } from "express"
import { NotificationModel } from "../models/notificationModel.js"
import { NotificationService } from "../services/notificationService.js"

export class NotificationController {
  // --- Create Notification (Internal Use) ---
  static async createInternal(req: Request, res: Response) {
    try {
      let { userId, executorId } = req.body
      const { type, title, message, extraData } = req.body

      if (!userId || !type || !title || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields" })
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

      return res.status(201).json({ success: true, data: notif })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // --- Get All Notifications ---
  static async getAll(req: Request, res: Response) {
    try {
      const notifications = await NotificationModel.getAll()
      res.status(200).json({ success: true, data: notifications })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // --- Get Notifications by User ---
  static async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      if (!userId) return res.status(400).json({ success: false, message: "userId is required" })

      const notifications = await NotificationModel.getByUser(userId)
      res.status(200).json({ success: true, data: notifications })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // --- Get Notification by Id ---
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationModel.getById(id)
      if (!notification) return res.status(404).json({ success: false, message: "Not found" })

      res.status(200).json({ success: true, data: notification })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // --- Mark Notification as Read ---
  static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const success = await NotificationModel.markAsRead(id)
      if (!success) return res.status(404).json({ success: false, message: "Not found" })

      res.status(200).json({ success: true, message: "Notification marked as read" })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // --- Delete Notification ---
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const success = await NotificationModel.delete(id)
      if (!success) return res.status(404).json({ success: false, message: "Not found" })

      res.status(200).json({ success: true, message: "Notification deleted" })
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}
