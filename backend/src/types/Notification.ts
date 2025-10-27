export type NotificationType =
  | "kyc"
  | "document"
  | "transaction"
  | "system"
  | "agreement"

export interface Notification {
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
}
