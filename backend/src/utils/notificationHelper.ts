import { NotificationService } from "../services/notificationService.js"
import type { NotificationType } from "../types/Notification.js"

interface NotifyPayload {
  type?: string
  title: string
  message: string
  txHash?: string
  data?: Record<string, any>
}

/**
 * Kirim notif ke admin + executor
 */
export async function notifyWithAdmins(
  executor: string,
  payload: NotifyPayload,
  adminList: string[] = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
) {
  const normalizedAdmins = adminList
    .map(a => a.toLowerCase())
    .filter(a => a !== executor.toLowerCase())

  const validTypes: NotificationType[] = ["kyc", "document", "transaction", "system", "agreement"]
  const type: NotificationType = validTypes.includes(payload.type as any)
    ? (payload.type as NotificationType)
    : "system"

  for (const admin of new Set(normalizedAdmins)) {
    await NotificationService.notify(
      admin,
      executor,
      type,
      payload.title,
      payload.message,
      { txHash: payload.txHash, data: payload.data }
    )
  }
}

/**
 * Kirim notif ke user lain (importer/exporter/dll)
 */
export async function notifyUsers(
  recipients: string | string[],
  payload: NotifyPayload,
  executor: string
) {
  const normalizedRecipients = (Array.isArray(recipients) ? recipients : [recipients])
    .filter(Boolean)
    .map(a => a.toLowerCase())

  const validTypes: NotificationType[] = ["kyc", "document", "transaction", "system", "agreement"]
  const type: NotificationType = validTypes.includes(payload.type as any)
    ? (payload.type as NotificationType)
    : "system"

  for (const user of new Set(normalizedRecipients)) {
    await NotificationService.notify(
      user,
      executor,
      type,
      payload.title,
      payload.message,
      { txHash: payload.txHash, data: payload.data }
    )
  }
}
