export interface NotificationExtra {
  txHash?: string
  data?: Record<string, any>
}

export interface Notification {
  id: string
  userId: string
  executorId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: number
  extraData?: NotificationExtra
}