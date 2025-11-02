/**
 * @file notificationHelper.ts
 * @description Utility functions to send notifications to admins or other users.
 */

import { NotificationService } from "../services/notificationService.js";
import type { NotificationType } from "../types/Notification.js";

/**
 * Payload structure for notifications
 */
export interface NotifyPayload<TData = Record<string, unknown>> {
  type?: NotificationType; // now strictly NotificationType
  title: string;
  message: string;
  txHash?: string;
  data?: TData;
}

/**
 * Send notifications to admin users and the executor (excluding executor from admins).
 *
 * @param executor - Wallet address of the user performing the action
 * @param payload - Notification payload
 * @param adminList - Optional list of admin wallet addresses
 */
export async function notifyWithAdmins<TData = Record<string, unknown>>(
  executor: string,
  payload: NotifyPayload<TData>,
  adminList: string[] = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
): Promise<void> {
  const normalizedAdmins = adminList.filter(a => a !== executor);

  const validTypes: NotificationType[] = ["kyc", "document", "transaction", "system", "agreement"];
  const type: NotificationType = payload.type && validTypes.includes(payload.type)
    ? payload.type
    : "system";

  for (const admin of new Set(normalizedAdmins)) {
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

/**
 * Send notifications to one or multiple users.
 *
 * @param recipients - Wallet address or list of wallet addresses
 * @param payload - Notification payload
 * @param executor - Wallet address of the user performing the action
 */
export async function notifyUsers<TData = Record<string, unknown>>(
  recipients: string | string[],
  payload: NotifyPayload<TData>,
  executor: string
): Promise<void> {
  const normalizedRecipients = (Array.isArray(recipients) ? recipients : [recipients])
    .filter(Boolean)
    .map(a => a.toLowerCase());

  const validTypes: NotificationType[] = ["kyc", "document", "transaction", "system", "agreement"];
  const type: NotificationType = payload.type && validTypes.includes(payload.type)
    ? payload.type
    : "system";

  for (const user of new Set(normalizedRecipients)) {
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
