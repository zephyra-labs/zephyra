/**
 * @file activityController.test.ts
 * @description Unit tests for activityController
 */

import {
  createActivity,
  getActivities,
  getActivityByAccountController,
} from "../activityController";
import * as activityModel from "../../models/activityModel";
import type { Request, Response } from "express";

// --- Helper: Mock Response Type-safe ---
function createMockResponse(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
}

// --- Mock activityModel ---
jest.mock("../../models/activityModel");

describe("activityController", () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  // --- createActivity ---
  describe("createActivity", () => {
    const reqBody = { account: "0x123", action: "deploy" };

    it("should create an activity", async () => {
      const saved = { id: "1", ...reqBody };
      (activityModel.addActivityLog as jest.Mock).mockResolvedValue(saved);

      await createActivity({ body: reqBody } as unknown as Request, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: saved }));
    });

    it("should fail if account missing", async () => {
      await createActivity({ body: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (activityModel.addActivityLog as jest.Mock).mockRejectedValue(new Error("fail"));
      await createActivity({ body: reqBody } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getActivities ---
  describe("getActivities", () => {
    it("should return filtered activities", async () => {
      const logs = [{ id: "1", account: "0x123" }];
      (activityModel.getAllActivities as jest.Mock).mockResolvedValue(logs);

      const reqQuery = { account: "0x123", limit: "10" };
      await getActivities({ query: reqQuery } as unknown as Request, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { count: 1, items: logs },
      }));
    });

    it("should handle errors", async () => {
      (activityModel.getAllActivities as jest.Mock).mockRejectedValue(new Error("fail"));
      await getActivities({ query: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getActivityByAccountController ---
  describe("getActivityByAccountController", () => {
    it("should return activities for account", async () => {
      const logs = [{ id: "1", account: "0x123" }];
      (activityModel.getActivityByAccount as jest.Mock).mockResolvedValue(logs);

      const req = { params: { account: "0x123" }, query: { limit: "10" } } as unknown as Request;
      await getActivityByAccountController(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          account: "0x123",
          count: 1,
          items: logs,
        },
      }));
    });

    it("should return empty array if no logs", async () => {
      (activityModel.getActivityByAccount as jest.Mock).mockResolvedValue([]);

      const req = { params: { account: "0x123" }, query: {} } as unknown as Request;
      await getActivityByAccountController(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { account: "0x123", count: 0, items: [] },
      }));
    });

    it("should handle service errors", async () => {
      (activityModel.getActivityByAccount as jest.Mock).mockRejectedValue(new Error("fail"));

      const req = { params: { account: "0x123" }, query: {} } as unknown as Request;
      await getActivityByAccountController(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
