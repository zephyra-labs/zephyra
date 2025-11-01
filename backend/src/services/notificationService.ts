/**
 * @file notificationService.ts
 * @description Business logic for creating, managing, and broadcasting user notifications.
 * Supports database persistence and realtime updates.
 */

import { v4 as uuidv4 } from "uuid"
import { NotificationModel } from "../models/notificationModel.js"
import type { Notification, NotificationType } from "../types/Notification.js"
import { broadcastNotificationToUser } from "../app.js"

export class NotificationService {
  /**
   * Creates and stores a new notification for a user.
   * Optionally broadcasts it in real-time.
   *
   * @async
   * @param {string} userId - Target user ID (will be normalized to lowercase).
   * @param {string} executorId - ID of the user or system triggering the notification.
   * @param {NotificationType} type - Notification type (e.g., "system", "trade", "chat").
   * @param {string} title - Short title of the notification.
   * @param {string} message - Detailed message content.
   * @param {Record<string, any>} [extraData={}] - Optional metadata or payload.
   * @returns {Promise<Notification>} The created notification object.
   * @throws {Error} If database save fails.
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

    // Save to database
    const saved = await NotificationModel.create(notification)

    // Realtime broadcast (safe guard)
    try {
      broadcastNotificationToUser(normalizedUserId, saved)
    } catch (err) {
      console.error("⚠️ Failed to broadcast notification:", err)
    }

    return saved
  }

  /**
   * Marks a notification as read.
   *
   * @async
   * @param {string} id - Notification ID to mark as read.
   * @returns {Promise<boolean>} True if update succeeded, false otherwise.
   * @throws {Error} If the notification cannot be updated.
   */
  static async markAsRead(id: string): Promise<boolean> {
    return NotificationModel.markAsRead(id)
  }

  /**
   * Deletes a notification.
   *
   * @async
   * @param {string} id - Notification ID to delete.
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise.
   * @throws {Error} If deletion fails.
   */
  static async delete(id: string): Promise<boolean> {
    return NotificationModel.delete(id)
  }

  /**
   * Retrieves all notifications for a specific user.
   *
   * @async
   * @param {string} userId - User ID to fetch notifications for.
   * @returns {Promise<Notification[]>} List of notifications, ordered by creation time.
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    return NotificationModel.getByUser(userId.toLowerCase())
  }
}
