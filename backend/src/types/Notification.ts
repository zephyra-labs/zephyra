/**
 * @file Notification.ts
 * @description Types for notifications system, including type, content, and metadata.
 */

/**
 * Allowed types of notifications.
 */
export type NotificationType =
  | "kyc"
  | "document"
  | "transaction"
  | "system"
  | "agreement"
  | "user"
  | "user_company";

/**
 * Represents a notification sent to a user.
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;

  /** Recipient user ID (wallet address or system ID) */
  userId: string;

  /** Executor ID who triggered the notification */
  executorId: string;

  /** Type/category of the notification */
  type: NotificationType;

  /** Notification title */
  title: string;

  /** Notification message/body */
  message: string;

  /** Whether the notification has been read by the user */
  read: boolean;

  /** Timestamp when the notification was created (Unix ms) */
  createdAt: number;

  /** Timestamp when the notification was last updated (Unix ms) */
  updatedAt?: number;

  /** Optional additional data (e.g., links, transaction hash, document ID) */
  extraData?: Record<string, unknown>;
}

/**
 * @description Payload structure for WebSocket notifications
 * Reusable for broadcastNotificationToUser
 */
export type NotificationPayload = Omit<Notification, "userId" | "read" | "updatedAt">;
