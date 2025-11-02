/**
 * @file NotificationDTO.ts
 * @description Data Transfer Object for Notification entity including validation and transformation for storage.
 */

import { Notification, NotificationType } from "../types/Notification.js";

/**
 * DTO for Notification
 */
export default class NotificationDTO {
  /** Unique notification ID */
  id: string;

  /** User ID who receives the notification */
  userId: string;

  /** User ID who triggers the notification */
  executorId: string;

  /** Notification type */
  type: NotificationType;

  /** Notification title */
  title: string;

  /** Notification message */
  message: string;

  /** Whether the notification has been read */
  read: boolean;

  /** Timestamp of creation */
  createdAt: number;

  /** Timestamp of last update */
  updatedAt?: number;

  /** Optional additional data */
  extraData?: Record<string, unknown>;

  /**
   * Constructor for NotificationDTO
   * @param {Partial<Notification>} data Partial notification data
   * @throws {Error} If required fields are missing
   */
  constructor(data: Partial<Notification>) {
    if (!data.userId) throw new Error("userId is required");
    if (!data.executorId) throw new Error("executorId is required");
    if (!data.type) throw new Error("type is required");
    if (!data.title) throw new Error("title is required");
    if (!data.message) throw new Error("message is required");

    this.id = data.id || crypto.randomUUID();
    this.userId = data.userId;
    this.executorId = data.executorId;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.read = data.read ?? false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.extraData = data.extraData;
  }

  /**
   * Transform DTO into Notification object ready for storage
   * @returns {Notification} Notification object
   */
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
    };
  }
}
