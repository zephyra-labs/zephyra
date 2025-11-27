/**
 * @file notificationDTO.test.ts
 * @description Unit tests for NotificationDTO
 */

import NotificationDTO from "../notificationDTO";
import type { Notification, NotificationType } from "../../types/Notification";

describe("NotificationDTO", () => {
  const baseData: Partial<Notification> = {
    userId: "user1",
    executorId: "user2",
    type: "info" as NotificationType,
    title: "Test Notification",
    message: "This is a test notification",
  };

  it("should throw if required fields are missing", () => {
    expect(() => new NotificationDTO({} as any)).toThrow(/userId is required/);
    expect(() => new NotificationDTO({ userId: "u" } as any)).toThrow(/executorId is required/);
    expect(() =>
      new NotificationDTO({ userId: "u", executorId: "e" } as any)
    ).toThrow(/type is required/);
    expect(() =>
      new NotificationDTO({ userId: "u", executorId: "e", type: "info" } as any)
    ).toThrow(/title is required/);
    expect(() =>
      new NotificationDTO({ userId: "u", executorId: "e", type: "info", title: "t" } as any)
    ).toThrow(/message is required/);
  });

  it("should create DTO with defaults", () => {
    const dto = new NotificationDTO(baseData);
    expect(dto.id).toBeDefined();
    expect(dto.userId).toBe(baseData.userId);
    expect(dto.executorId).toBe(baseData.executorId);
    expect(dto.type).toBe(baseData.type);
    expect(dto.title).toBe(baseData.title);
    expect(dto.message).toBe(baseData.message);
    expect(dto.read).toBe(false);
    expect(typeof dto.createdAt).toBe("number");
    expect(typeof dto.updatedAt).toBe("number");
    expect(dto.extraData).toBeUndefined();
  });

  it("should accept all fields and extraData", () => {
    const extra = { foo: "bar" };
    const now = Date.now();
    const dto = new NotificationDTO({
      ...baseData,
      id: "notif123",
      read: true,
      createdAt: now,
      updatedAt: now,
      extraData: extra,
    });

    expect(dto.id).toBe("notif123");
    expect(dto.read).toBe(true);
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
    expect(dto.extraData).toEqual(extra);
  });

  it("toFirestore should return proper Notification object", () => {
    const extra = { foo: "bar" };
    const dto = new NotificationDTO({ ...baseData, extraData: extra });
    const fsObj = dto.toFirestore();
    expect(fsObj.id).toBe(dto.id);
    expect(fsObj.userId).toBe(dto.userId);
    expect(fsObj.executorId).toBe(dto.executorId);
    expect(fsObj.type).toBe(dto.type);
    expect(fsObj.title).toBe(dto.title);
    expect(fsObj.message).toBe(dto.message);
    expect(fsObj.read).toBe(dto.read);
    expect(fsObj.createdAt).toBe(dto.createdAt);
    expect(fsObj.updatedAt).toBe(dto.updatedAt);
    expect(fsObj.extraData).toEqual(extra);
  });
});
