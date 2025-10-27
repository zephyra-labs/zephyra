import { Notification, NotificationType } from "../types/Notification.js"

export default class NotificationDTO {
  id: string
  userId: string
  executorId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: number
  updatedAt?: number
  extraData?: Record<string, any>

  constructor(data: Partial<Notification>) {
    if (!data.userId) throw new Error("userId is required")
    if (!data.executorId) throw new Error("executorId is required")
    if (!data.type) throw new Error("type is required")
    if (!data.title) throw new Error("title is required")
    if (!data.message) throw new Error("message is required")

    this.id = data.id || crypto.randomUUID()
    this.userId = data.userId
    this.executorId = data.executorId
    this.type = data.type
    this.title = data.title
    this.message = data.message
    this.read = data.read ?? false
    this.createdAt = data.createdAt || Date.now()
    this.updatedAt = data.updatedAt || Date.now()
    this.extraData = data.extraData
  }

  toFirestore(): Notification {
    return {
      id: this.id,
      userId: this.userId,
      executorId: this.executorId,
      type: this.type,
      title: this.title,
      message: this.message,
      read: this.read,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      extraData: this.extraData,
    }
  }
}
