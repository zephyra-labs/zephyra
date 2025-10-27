import { v4 as uuidv4 } from "uuid"
import { NotificationModel } from "../models/notificationModel.js"
import type { Notification, NotificationType } from "../types/Notification.js"
import { broadcastNotificationToUser } from "../app.js"

export class NotificationService {
  /**
   * Create and store a notification (supports extraData + realtime)
   */
  static async notify(
    userId: string,
    executorId: string,
    type: NotificationType,
    title: string,
    message: string,
    extraData: Record<string, any> = {},
  ): Promise<Notification> {
    const normalizedUserId = userId.toLowerCase()

    const notification: Notification = {
      id: uuidv4(),
      userId: normalizedUserId,
      executorId: executorId || "system",
      type,
      title,
      message,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      extraData,
    }

    // 🧠 Save to database
    const saved = await NotificationModel.create(notification)

    // 🔔 Realtime broadcast (safe check)
    try {
      broadcastNotificationToUser(normalizedUserId, saved)
    } catch (err) {
      console.error("⚠️ Failed to broadcast notification:", err)
    }

    return saved
  }

  /** Mark notification as read */
  static async markAsRead(id: string): Promise<boolean> {
    return NotificationModel.markAsRead(id)
  }

  /** Delete notification */
  static async delete(id: string): Promise<boolean> {
    return NotificationModel.delete(id)
  }

  /** Get all notifications for a user */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    return NotificationModel.getByUser(userId.toLowerCase())
  }
}
