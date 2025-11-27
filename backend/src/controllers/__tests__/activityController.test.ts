/**
 * @file activityController.test.ts
 * @description 100% coverage unit tests for activityController
 */

import type { Request, Response } from "express"
import * as activityController from "../activityController"
import * as activityModel from "../../models/activityModel"
import { success, failure, handleError } from "../../utils/responseHelper"

// --- Mock helpers ---
jest.mock("../../utils/responseHelper", () => ({
  success: jest.fn(),
  failure: jest.fn(),
  handleError: jest.fn(),
}))
jest.mock("../../models/activityModel")

function mockRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as any
}

describe("activityController FULL COVERAGE", () => {
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockRes()
  })

  // -----------------------------
  // createActivity
  // -----------------------------
  describe("createActivity", () => {
    it("should fail if body missing", async () => {
      await activityController.createActivity({} as Request, res)
      expect(failure).toHaveBeenCalledWith(res, "Request body is required", 400)
    })

    it("should fail if account missing", async () => {
      await activityController.createActivity({ body: { action: "deploy" } } as Request, res)
      expect(failure).toHaveBeenCalledWith(res, "Missing required field: account", 422)
    })

    it("should fail if action missing", async () => {
      await activityController.createActivity({ body: { account: "0x123" } } as Request, res)
      expect(failure).toHaveBeenCalledWith(res, "Missing required field: action", 422)
    })

    it("should fail if timestamp invalid", async () => {
      await activityController.createActivity(
        { body: { account: "0x123", action: "deploy", timestamp: "bad" } } as any,
        res,
      )
      expect(failure).toHaveBeenCalledWith(res, "timestamp must be a number", 422)
    })

    it("should create activity successfully", async () => {
      const mockActivity = { account: "0x123", action: "deploy" } as any
      ;(activityModel.addActivityLog as jest.Mock).mockResolvedValue(mockActivity)
      await activityController.createActivity(
        { body: { account: "0x123", action: "deploy" } } as Request,
        res,
      )
      expect(success).toHaveBeenCalledWith(res, mockActivity, 201)
    })

    it("should handle model error", async () => {
      (activityModel.addActivityLog as jest.Mock).mockRejectedValue(new Error("fail"))
      await activityController.createActivity(
        { body: { account: "0x1", action: "deploy" } } as any,
        res,
      )
      expect(handleError).toHaveBeenCalled()
    })
  })

  // -----------------------------
  // getActivities
  // -----------------------------
  describe("getActivities", () => {
    it("should fail if limit invalid", async () => {
      await activityController.getActivities({ query: { limit: "bad" } } as any, res)
      expect(failure).toHaveBeenCalledWith(res, "limit must be a number", 400)
    })

    it("should fail if startAfterTimestamp invalid", async () => {
      await activityController.getActivities({ query: { startAfterTimestamp: "bad" } } as any, res)
      expect(failure).toHaveBeenCalledWith(res, "startAfterTimestamp must be a number", 400)
    })

    it("should return logs successfully", async () => {
      const logs = [{ account: "0x123" }] as any
      ;(activityModel.getAllActivities as jest.Mock).mockResolvedValue(logs)
      await activityController.getActivities({ query: { account: "0x123" } } as any, res)
      expect(success).toHaveBeenCalledWith(res, { count: logs.length, items: logs })
    })

    it("should handle model error", async () => {
      (activityModel.getAllActivities as jest.Mock).mockRejectedValue(new Error("fail"))
      await activityController.getActivities({ query: {} } as any, res)
      expect(handleError).toHaveBeenCalled()
    })
    
    it("should return logs with numeric limit and startAfterTimestamp", async () => {
      const logs = [{ account: "0x123" }] as any
      ;(activityModel.getAllActivities as jest.Mock).mockResolvedValue(logs)

      await activityController.getActivities(
        { query: { limit: "10", startAfterTimestamp: "1690000000000" } } as any,
        res,
      )

      expect(activityModel.getAllActivities).toHaveBeenCalledWith({
        account: undefined,
        txHash: undefined,
        limit: 10,
        startAfterTimestamp: 1690000000000,
      })
      expect(success).toHaveBeenCalledWith(res, { count: logs.length, items: logs })
    })
  })

  // -----------------------------
  // getActivityByAccountController
  // -----------------------------
  describe("getActivityByAccountController", () => {
    it("should fail if account param missing", async () => {
      await activityController.getActivityByAccountController({ params: {} } as any, res)
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400)
    })

    it("should fail if limit invalid", async () => {
      await activityController.getActivityByAccountController(
        { params: { account: "0x123" }, query: { limit: "bad" } } as any,
        res,
      )
      expect(failure).toHaveBeenCalledWith(res, "limit must be a number", 400)
    })

    it("should fail if startAfterTimestamp invalid", async () => {
      await activityController.getActivityByAccountController(
        { params: { account: "0x123" }, query: { startAfterTimestamp: "bad" } } as any,
        res,
      )
      expect(failure).toHaveBeenCalledWith(res, "startAfterTimestamp must be a number", 400)
    })

    it("should return empty logs", async () => {
      ;(activityModel.getActivityByAccount as jest.Mock).mockResolvedValue([])
      await activityController.getActivityByAccountController(
        { params: { account: "0x123" }, query: {} } as any,
        res,
      )
      expect(success).toHaveBeenCalledWith(res, { account: "0x123", count: 0, items: [] })
    })

    it("should return logs", async () => {
      const logs = [{ account: "0x123" }] as any
      ;(activityModel.getActivityByAccount as jest.Mock).mockResolvedValue(logs)
      await activityController.getActivityByAccountController(
        { params: { account: "0x123" }, query: { limit: "5" } } as any,
        res,
      )
      expect(success).toHaveBeenCalledWith(res, { account: "0x123", count: logs.length, items: logs })
    })

    it("should handle model error", async () => {
      (activityModel.getActivityByAccount as jest.Mock).mockRejectedValue(new Error("fail"))
      await activityController.getActivityByAccountController(
        { params: { account: "0x123" }, query: {} } as any,
        res,
      )
      expect(handleError).toHaveBeenCalled()
    })
    
    it("should return logs with numeric limit and startAfterTimestamp", async () => {
      const logs = [{ account: "0x123" }] as any
      ;(activityModel.getActivityByAccount as jest.Mock).mockResolvedValue(logs)

      await activityController.getActivityByAccountController(
        {
          params: { account: "0x123" },
          query: { limit: "5", startAfterTimestamp: "1690000000000" },
        } as any,
        res,
      )

      expect(activityModel.getActivityByAccount).toHaveBeenCalledWith("0x123", {
        limit: 5,
        startAfterTimestamp: 1690000000000,
      })
      expect(success).toHaveBeenCalledWith(res, { account: "0x123", count: logs.length, items: logs })
    })
  })
})
