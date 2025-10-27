import type { Notification } from "../types/Notification.js"
import { db } from "../config/firebase.js"

const collection = db.collection("notifications")

export class NotificationModel {
  // --- Create Notification ---
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

  // --- Get All Notifications ---
  static async getAll(): Promise<Notification[]> {
    const snapshot = await collection.get()
    return snapshot.docs.map((doc) => doc.data() as Notification)
  }

  // --- Get Notifications by User ---
  static async getByUser(userId: string): Promise<Notification[]> {
    const snapshot = await collection.where("userId", "==", userId).get()
    return snapshot.docs.map((doc) => doc.data() as Notification)
  }

  // --- Get by Id ---
  static async getById(id: string): Promise<Notification | null> {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    return doc.data() as Notification
  }

  // --- Mark as Read ---
  static async markAsRead(id: string): Promise<boolean> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return false

    await docRef.update({ read: true, updatedAt: Date.now() })
    return true
  }

  // --- Delete Notification ---
  static async delete(id: string): Promise<boolean> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return false

    await docRef.delete()
    return true
  }
}
