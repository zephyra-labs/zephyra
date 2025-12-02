/**
 * @file notificationHelper.ts
 * @description Refactored utility functions to send notifications to admins or other users.
 */

import { NotificationService } from "../services/notificationService";
import type { NotificationType } from "../types/Notification";

/**
 * Payload structure for notifications
 */
export interface NotifyPayload<TData = Record<string, unknown>> {
  type?: NotificationType;
  title: string;
  message: string;
  txHash?: string;
  data?: TData;
}

// ──────────────────────────────
// Helper functions
// ──────────────────────────────

const VALID_TYPES: NotificationType[] = ["kyc", "document", "transaction", "system", "agreement"];

/** Normalize notification type or default to "system" */
const normalizeType = (type?: string): NotificationType =>
  type && VALID_TYPES.includes(type as NotificationType) ? (type as NotificationType) : "system";

/** Normalize recipient(s) to lowercase unique array */
const normalizeRecipients = (recipients: string | string[]): string[] =>
  Array.from(new Set((Array.isArray(recipients) ? recipients : [recipients])
    .filter(Boolean)
    .map(r => r.toLowerCase())
  ));

// ──────────────────────────────
// Public functions
// ──────────────────────────────

/** Notify all admins except executor */
export async function notifyWithAdmins<TData = Record<string, unknown>>(
  executor: string,
  payload: NotifyPayload<TData>,
  adminList: string[] = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
): Promise<void> {
  const recipients = normalizeRecipients(adminList.filter(a => a !== executor));
  const type = normalizeType(payload.type);

  for (const admin of recipients) {
    await NotificationService.notify(
      admin,
      executor,
      type,
      payload.title,
      payload.message,
      { txHash: payload.txHash, data: payload.data }
    );
  }
}

/** Notify one or multiple users */
export async function notifyUsers<TData = Record<string, unknown>>(
  recipients: string | string[],
  payload: NotifyPayload<TData>,
  executor: string
): Promise<void> {
  const users = normalizeRecipients(recipients);
  const type = normalizeType(payload.type);

  for (const user of users) {
    await NotificationService.notify(
      user,
      executor,
      type,
      payload.title,
      payload.message,
      { txHash: payload.txHash, data: payload.data }
    );
  }
}
