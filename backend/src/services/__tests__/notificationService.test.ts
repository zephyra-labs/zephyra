/**
 * @file notificationService.test.ts
 * @description Unit tests for NotificationService
 */

import { NotificationService } from "../notificationService"
import { NotificationModel } from "../../models/notificationModel"
import { broadcastNotificationToUser } from "../../ws/notificationWS"
import type { Notification } from "../../types/Notification"

// 🔹 Mock database model & websocket broadcast
jest.mock("../../models/notificationModel")
jest.mock("../../ws/notificationWS")

describe("NotificationService", () => {
  const mockNotification: Notification = {
    id: "uuid-123",
    userId: "user1",
    executorId: "system",
    type: "system",
    title: "Test Notification",
    message: "This is a test notification",
    read: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    extraData: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ───────────────────────────────────────────────
  describe("notify", () => {
    it("should create and broadcast a notification", async () => {
      // Mock database create
      ;(NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(broadcastNotificationToUser as jest.Mock).mockImplementation(() => {})

      const result = await NotificationService.notify(
        "User1",
        "system",
        "system",
        "Test Notification",
        "This is a test notification"
      )

      expect(NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: "user1",
        executorId: "system",
        title: "Test Notification",
        message: "This is a test notification",
        type: "system",
        read: false,
      }))

      expect(broadcastNotificationToUser).toHaveBeenCalledWith("user1", mockNotification)
      expect(result).toEqual(mockNotification)
    })

    it("should catch errors from broadcast and still return saved notification", async () => {
      ;(NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(broadcastNotificationToUser as jest.Mock).mockImplementation(() => {
        throw new Error("Broadcast failed")
      })

      const result = await NotificationService.notify(
        "User1",
        "system",
        "system",
        "Test Notification",
        "This is a test notification"
      )

      expect(result).toEqual(mockNotification)
    })
  })

  // ───────────────────────────────────────────────
  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      ;(NotificationModel.markAsRead as jest.Mock).mockResolvedValue(true)

      const result = await NotificationService.markAsRead("uuid-123")
      expect(NotificationModel.markAsRead).toHaveBeenCalledWith("uuid-123")
      expect(result).toBe(true)
    })
  })

  // ───────────────────────────────────────────────
  describe("delete", () => {
    it("should delete a notification", async () => {
      ;(NotificationModel.delete as jest.Mock).mockResolvedValue(true)

      const result = await NotificationService.delete("uuid-123")
      expect(NotificationModel.delete).toHaveBeenCalledWith("uuid-123")
      expect(result).toBe(true)
    })
  })

  // ───────────────────────────────────────────────
  describe("getUserNotifications", () => {
    it("should return notifications for a user", async () => {
      ;(NotificationModel.getByUser as jest.Mock).mockResolvedValue([mockNotification])

      const result = await NotificationService.getUserNotifications("User1")
      expect(NotificationModel.getByUser).toHaveBeenCalledWith("user1")
      expect(result).toEqual([mockNotification])
    })
  })
})
