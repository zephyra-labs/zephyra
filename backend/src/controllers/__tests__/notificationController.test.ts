/**
 * @file notificationController.test.ts
 * @description Unit tests for NotificationController
 */

import { Request } from "express";
import { NotificationController } from "../notificationController";
import { NotificationService } from "../../services/notificationService";
import { NotificationModel } from "../../models/notificationModel";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/notificationService");
jest.mock("../../models/notificationModel");
jest.mock("../../utils/responseHelper");

/**
 * Helper to create a type-safe mocked Express response
 */
function createMockResponse(): jest.Mocked<Partial<import("express").Response>> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<import("express").Response>;
}

describe("NotificationController", () => {
  let mockRes: jest.Mocked<import("express").Response>;
  const mockNotif = { id: "notif1", userId: "user1", type: "info", title: "Test", message: "Hello" };
  const mockNotifs = [mockNotif];

  beforeEach(() => {
    mockRes = createMockResponse() as jest.Mocked<import("express").Response>;
    jest.clearAllMocks();
  });

  describe("createInternal", () => {
    it("should create internal notification", async () => {
      (NotificationService.notify as jest.Mock).mockResolvedValue(mockNotif);

      const req = {
        body: { userId: "user1", type: "info", title: "Test", message: "Hello" }
      } as Request;

      await NotificationController.createInternal(req, mockRes);

      expect(NotificationService.notify).toHaveBeenCalledWith(
        "user1",
        "system",
        "info",
        "Test",
        "Hello",
        undefined
      );
      expect(success).toHaveBeenCalledWith(mockRes, mockNotif, 201);
    });

    it("should fail if required fields missing", async () => {
      await NotificationController.createInternal({ body: {} } as Request, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "Missing required fields", 400);
    });

    it("should handle service errors", async () => {
      const err = new Error("fail");
      (NotificationService.notify as jest.Mock).mockRejectedValue(err);

      const req = { body: { userId: "user1", type: "info", title: "Test", message: "Hello" } } as Request;

      await NotificationController.createInternal(req, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to create notification", 500);
    });
  });

  describe("getAll", () => {
    it("should return all notifications", async () => {
      (NotificationModel.getAll as jest.Mock).mockResolvedValue(mockNotifs);

      await NotificationController.getAll({} as Request, mockRes);

      expect(NotificationModel.getAll).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockNotifs, 200);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (NotificationModel.getAll as jest.Mock).mockRejectedValue(err);

      await NotificationController.getAll({} as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch notifications", 500);
    });
  });

  describe("getByUser", () => {
    it("should return notifications for a user", async () => {
      (NotificationModel.getByUser as jest.Mock).mockResolvedValue(mockNotifs);

      await NotificationController.getByUser({ params: { userId: "user1" } } as unknown as Request, mockRes);

      expect(NotificationModel.getByUser).toHaveBeenCalledWith("user1");
      expect(success).toHaveBeenCalledWith(mockRes, mockNotifs, 200);
    });

    it("should fail if userId missing", async () => {
      await NotificationController.getByUser({ params: {} } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Missing userId parameter", 422);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (NotificationModel.getByUser as jest.Mock).mockRejectedValue(err);

      await NotificationController.getByUser({ params: { userId: "user1" } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch user notifications", 500);
    });
  });

  describe("getById", () => {
    it("should return notification by id", async () => {
      (NotificationModel.getById as jest.Mock).mockResolvedValue(mockNotif);

      await NotificationController.getById({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(NotificationModel.getById).toHaveBeenCalledWith("notif1");
      expect(success).toHaveBeenCalledWith(mockRes, mockNotif, 200);
    });

    it("should return 404 if notification not found", async () => {
      (NotificationModel.getById as jest.Mock).mockResolvedValue(null);

      await NotificationController.getById({ params: { id: "notif999" } } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Notification not found", 404);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (NotificationModel.getById as jest.Mock).mockRejectedValue(err);

      await NotificationController.getById({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch notification", 500);
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      (NotificationModel.markAsRead as jest.Mock).mockResolvedValue(true);

      await NotificationController.markAsRead({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(NotificationModel.markAsRead).toHaveBeenCalledWith("notif1");
      expect(success).toHaveBeenCalledWith(mockRes, { message: "Notification marked as read" }, 200);
    });

    it("should return 404 if notification not found", async () => {
      (NotificationModel.markAsRead as jest.Mock).mockResolvedValue(false);

      await NotificationController.markAsRead({ params: { id: "notif999" } } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Notification not found", 404);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (NotificationModel.markAsRead as jest.Mock).mockRejectedValue(err);

      await NotificationController.markAsRead({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to mark notification as read", 500);
    });
  });

  describe("delete", () => {
    it("should delete notification", async () => {
      (NotificationModel.delete as jest.Mock).mockResolvedValue(true);

      await NotificationController.delete({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(NotificationModel.delete).toHaveBeenCalledWith("notif1");
      expect(success).toHaveBeenCalledWith(mockRes, { message: "Notification deleted successfully" }, 200);
    });

    it("should return 404 if notification not found", async () => {
      (NotificationModel.delete as jest.Mock).mockResolvedValue(false);

      await NotificationController.delete({ params: { id: "notif999" } } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Notification not found", 404);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (NotificationModel.delete as jest.Mock).mockRejectedValue(err);

      await NotificationController.delete({ params: { id: "notif1" } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to delete notification", 500);
    });
  });
});
