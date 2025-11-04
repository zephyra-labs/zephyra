/**
 * @file notificationModel.ts
 * @description Model for managing user notifications in Firestore.
 */

import type { Notification } from "../types/Notification"
import { db } from "../config/firebase"

/** Firestore collection reference for notifications */
const collection = db.collection("notifications")

/**
 * Model for managing user notifications in Firestore.
 * Provides methods for CRUD operations and state management (e.g., mark as read).
 * @class
 */
export class NotificationModel {
  /**
   * Create a new notification entry.
   * 
   * @param {Notification} data - Notification data to create.
   * @returns {Promise<Notification>} The newly created notification.
   * @throws {Error} If required fields are missing or notification already exists.
   */
  static async create(data: Notification): Promise<Notification> {
    if (!data.id || !data.userId || !data.type || !data.title || !data.message) {
      throw new Error("Missing required notification fields")
    }

    const docRef = collection.doc(data.id)
    const doc = await docRef.get()
    if (doc.exists) throw new Error(`Notification with id ${data.id} already exists`)

    const newDoc: Notification = {
      id: data.id,
      userId: data.userId,
      executorId: data.executorId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: data.read ?? false,
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: data.updatedAt ?? Date.now(),
      extraData: data.extraData ?? {},
    }

    await docRef.set(newDoc)
    return newDoc
  }

  /**
   * Retrieve all notifications in the system.
   * 
   * @returns {Promise<Notification[]>} List of all notifications.
   */
  static async getAll(): Promise<Notification[]> {
    const snapshot = await collection.get()
    return snapshot.docs.map((doc) => doc.data() as Notification)
  }

  /**
   * Retrieve all notifications belonging to a specific user.
   * 
   * @param {string} userId - The ID of the user to fetch notifications for.
   * @returns {Promise<Notification[]>} List of user notifications.
   */
  static async getByUser(userId: string): Promise<Notification[]> {
    const snapshot = await collection.where("userId", "==", userId).get()
    return snapshot.docs.map((doc) => doc.data() as Notification)
  }

  /**
   * Retrieve a single notification by its unique ID.
   * 
   * @param {string} id - The ID of the notification.
   * @returns {Promise<Notification | null>} The notification if found, otherwise `null`.
   */
  static async getById(id: string): Promise<Notification | null> {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    return doc.data() as Notification
  }

  /**
   * Mark a notification as read by its ID.
   * 
   * @param {string} id - The ID of the notification to mark as read.
   * @returns {Promise<boolean>} Returns `true` if updated successfully, `false` if not found.
   */
  static async markAsRead(id: string): Promise<boolean> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return false

    await docRef.update({ read: true, updatedAt: Date.now() })
    return true
  }

  /**
   * Delete a notification from the database.
   * 
   * @param {string} id - The ID of the notification to delete.
   * @returns {Promise<boolean>} Returns `true` if deleted successfully, `false` if not found.
   */
  static async delete(id: string): Promise<boolean> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return false

    await docRef.delete()
    return true
  }
}
