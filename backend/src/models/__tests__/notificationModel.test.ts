/**
 * @file notificationModel.test.ts
 * @description Unit tests for NotificationModel using in-memory Firestore mock.
 */

import { NotificationModel } from "../notificationModel";
import type { Notification, NotificationType } from "../../types/Notification";

// --- Mock Firestore dependency
jest.mock("../../config/firebase", () => {
  const dataStore: Record<string, any> = {};
  let idCounter = 1;

  const mockCollectionInstance = {
    filters: [] as ((item: any) => boolean)[],
    orderField: null as string | null,
    orderDirection: "asc" as "asc" | "desc",
    limitCount: null as number | null,
    offsetCount: null as number | null,

    doc: jest.fn((id: string) => ({
      id,
      get: jest.fn(async () => ({
        exists: !!dataStore[id],
        id,
        data: () => dataStore[id],
      })),
      set: jest.fn(async (data) => {
        dataStore[id] = { id, ...data };
        return true;
      }),
      update: jest.fn(async (data) => {
        if (!dataStore[id]) throw new Error("Notification not found");
        dataStore[id] = { ...dataStore[id], ...data };
        return true;
      }),
      delete: jest.fn(async () => {
        if (!dataStore[id]) throw new Error("Notification not found");
        delete dataStore[id];
        return true;
      }),
    })),

    add: jest.fn(async (data) => {
      const id = "notif" + idCounter++;
      dataStore[id] = { id, ...data };
      return { id };
    }),

    where: jest.fn(function (field: string, op: string, value: any) {
      this.filters.push((item: any) => {
        const v = item[field];
        switch (op) {
          case "==": return v === value;
          default: return true;
        }
      });
      return this;
    }),

    get: jest.fn(async function () {
      let items = Object.values(dataStore);

      for (const filter of this.filters) items = items.filter(filter);

      if (this.orderField) {
        items.sort((a, b) => {
          const aVal = a[this.orderField!];
          const bVal = b[this.orderField!];
          if (aVal < bVal) return this.orderDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return this.orderDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      if (this.offsetCount) items = items.slice(this.offsetCount);
      if (this.limitCount != null) items = items.slice(0, this.limitCount);

      return {
        size: items.length,
        empty: items.length === 0,
        docs: items.map(d => ({ id: d.id, data: () => d })),
      };
    }),

    __reset: function () {
      this.filters = [];
      this.orderField = null;
      this.orderDirection = "asc";
      this.limitCount = null;
      this.offsetCount = null;
    },
  };

  const mockCollection = jest.fn(() => mockCollectionInstance);
  return { db: { collection: mockCollection }, __dataStore: dataStore };
});

describe("NotificationModel", () => {
  const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
    id: "notif1",
    userId: "user123",
    executorId: "admin",
    type: "system" as NotificationType,
    title: "Test Notification",
    message: "This is a test",
    read: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    extraData: {},
    ...overrides,
  });

  beforeEach(() => {
    const mockFirebase = jest.requireMock("../../config/firebase");
    for (const key of Object.keys(mockFirebase.__dataStore)) delete mockFirebase.__dataStore[key];
    mockFirebase.db.collection().__reset();
  });

  it("should create a new notification", async () => {
    const notif = makeNotification();
    const created = await NotificationModel.create(notif);
    expect(created).toMatchObject({ id: "notif1", userId: "user123", read: false });
  });

  it("should throw error if required fields missing", async () => {
    const invalid = { ...makeNotification(), title: undefined };
    // @ts-expect-error testing invalid
    await expect(NotificationModel.create(invalid)).rejects.toThrow("Missing required notification fields");
  });

  it("should throw error if notification already exists", async () => {
    const notif = makeNotification();
    await NotificationModel.create(notif);
    await expect(NotificationModel.create(notif)).rejects.toThrow(/already exists/);
  });

  it("should get notification by ID", async () => {
    const notif = makeNotification({ id: "n2" });
    await NotificationModel.create(notif);
    const found = await NotificationModel.getById("n2");
    expect(found?.id).toBe("n2");
  });

  it("should return null for non-existing ID", async () => {
    const found = await NotificationModel.getById("nonexistent");
    expect(found).toBeNull();
  });

  it("should get all notifications", async () => {
    await NotificationModel.create(makeNotification({ id: "n3" }));
    await NotificationModel.create(makeNotification({ id: "n4" }));
    const all = await NotificationModel.getAll();
    expect(all.length).toBe(2);
  });

  it("should get notifications by userId", async () => {
    await NotificationModel.create(makeNotification({ id: "n5", userId: "userX" }));
    await NotificationModel.create(makeNotification({ id: "n6", userId: "userY" }));
    const userXNotifs = await NotificationModel.getByUser("userX");
    expect(userXNotifs.length).toBe(1);
    expect(userXNotifs[0].userId).toBe("userX");
  });

  it("should mark notification as read", async () => {
    await NotificationModel.create(makeNotification({ id: "n7" }));
    const result = await NotificationModel.markAsRead("n7");
    expect(result).toBe(true);
    const notif = await NotificationModel.getById("n7");
    expect(notif?.read).toBe(true);
  });

  it("should return false marking non-existing notification as read", async () => {
    const result = await NotificationModel.markAsRead("nope");
    expect(result).toBe(false);
  });

  it("should delete notification", async () => {
    await NotificationModel.create(makeNotification({ id: "n8" }));
    const result = await NotificationModel.delete("n8");
    expect(result).toBe(true);
    const notif = await NotificationModel.getById("n8");
    expect(notif).toBeNull();
  });

  it("should return false deleting non-existing notification", async () => {
    const result = await NotificationModel.delete("nope");
    expect(result).toBe(false);
  });
});
