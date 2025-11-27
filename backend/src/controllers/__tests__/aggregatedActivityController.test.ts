/**
 * @file aggregatedActivityController.test.ts
 * @description Unit tests for aggregatedActivityController
 */

import {
  addAggregatedActivity,
  getAggregatedActivityById,
  getAggregatedActivities,
  addAggregatedTag,
  removeAggregatedTag,
} from "../aggregatedActivityController";
import aggregatedActivityModel from "../../models/aggregatedActivityModel";
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

// --- Mock model ---
jest.mock("../../models/aggregatedActivityModel");

describe("aggregatedActivityController", () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  // --- addAggregatedActivity ---
  describe("addAggregatedActivity", () => {
    const reqBody = { account: "0x123", action: "deploy" };

    it("should create aggregated activity", async () => {
      const saved = { id: "1", ...reqBody };
      (aggregatedActivityModel.add as jest.Mock).mockResolvedValue(saved);

      await addAggregatedActivity({ body: reqBody } as unknown as Request, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: saved }));
    });

    it("should fail if account missing", async () => {
      await addAggregatedActivity({ body: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should fail if body is missing", async () => {
      await addAggregatedActivity({} as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should fail if action is not a string", async () => {
      const reqBodyInvalid = { account: "0x123", action: 123 };
      await addAggregatedActivity({ body: reqBodyInvalid } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (aggregatedActivityModel.add as jest.Mock).mockRejectedValue(new Error("fail"));
      await addAggregatedActivity({ body: reqBody } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getAggregatedActivityById ---
  describe("getAggregatedActivityById", () => {
    it("should return activity by id", async () => {
      const log = { id: "1", account: "0x123" };
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue(log);

      await getAggregatedActivityById({ params: { id: "1" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: log }));
    });

    it("should return 404 if not found", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue(null);

      await getAggregatedActivityById({ params: { id: "1" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should fail if id missing", async () => {
      await getAggregatedActivityById({ params: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockRejectedValue(new Error("fail"));
      await getAggregatedActivityById({ params: { id: "1" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getAggregatedActivities ---
  describe("getAggregatedActivities", () => {
    it("should return filtered activities", async () => {
      const result: { data: { id: string }[]; nextStartAfterTimestamp: number } = {
        data: [{ id: "1" }],
        nextStartAfterTimestamp: 12345,
      };
      (aggregatedActivityModel.getAll as jest.Mock).mockResolvedValue(result);

      const reqQuery = { account: "0x123", limit: "10" };
      await getAggregatedActivities({ query: reqQuery } as unknown as Request, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { count: 1, items: [{ id: "1" }], nextStartAfterTimestamp: 12345 },
      }));
    });

    it("should return activities with numeric limit and startAfterTimestamp", async () => {
      const result = { data: [{ id: "1" }], nextStartAfterTimestamp: 12345 };
      (aggregatedActivityModel.getAll as jest.Mock).mockResolvedValue(result);

      await getAggregatedActivities(
        { query: { limit: "10", startAfterTimestamp: "1690000000000" } } as unknown as Request,
        res,
      );

      expect(aggregatedActivityModel.getAll).toHaveBeenCalledWith({
        account: undefined,
        txHash: undefined,
        contractAddress: undefined,
        tags: undefined,
        limit: 10,
        startAfterTimestamp: 1690000000000,
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { count: 1, items: [{ id: "1" }], nextStartAfterTimestamp: 12345 },
      }));
    });
    
    it("should parse tags query into array", async () => {
      (aggregatedActivityModel.getAll as jest.Mock).mockResolvedValue({
        data: [],
        nextStartAfterTimestamp: 123,
      });

      const req = {
        query: {
          tags: "urgent,contract,audit",
        },
      } as unknown as Request;

      await getAggregatedActivities(req, res);

      expect(aggregatedActivityModel.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ["urgent", "contract", "audit"],
        })
      );
    });
    
    it("should set nextStartAfterTimestamp to null when service returns undefined", async () => {
      (aggregatedActivityModel.getAll as jest.Mock).mockResolvedValue({
        data: [{ id: "1" }],
        nextStartAfterTimestamp: undefined, // <-- intentionally undefined
      });

      const req = { query: {} } as Request;
      await getAggregatedActivities(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            count: 1,
            items: [{ id: "1" }],
            nextStartAfterTimestamp: null,
          },
        })
      );
    });

    it("should fail if limit is not a number", async () => {
      await getAggregatedActivities({ query: { limit: "abc" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should fail if startAfterTimestamp is not a number", async () => {
      await getAggregatedActivities({ query: { startAfterTimestamp: "abc" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (aggregatedActivityModel.getAll as jest.Mock).mockRejectedValue(new Error("fail"));
      await getAggregatedActivities({ query: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- addAggregatedTag ---
  describe("addAggregatedTag", () => {
    it("should add tag successfully", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue({ id: "1" });
      (aggregatedActivityModel.addTag as jest.Mock).mockResolvedValue(true);

      await addAggregatedTag({ params: { id: "1" }, body: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { tag: "urgent", message: "Tag added successfully" },
      }));
    });

    it("should fail if id or tag missing", async () => {
      await addAggregatedTag({ params: {}, body: { tag: "x" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));

      await addAggregatedTag({ params: { id: "1" }, body: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (aggregatedActivityModel.addTag as jest.Mock).mockRejectedValue(new Error("fail"));
      await addAggregatedTag({ params: { id: "1" }, body: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    
    it("should fail if logs not found", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue(null);

      await addAggregatedTag({ params: { id: "1" }, body: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- removeAggregatedTag ---
  describe("removeAggregatedTag", () => {
    it("should remove tag successfully", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue({ id: "1" });
      (aggregatedActivityModel.removeTag as jest.Mock).mockResolvedValue(true);

      await removeAggregatedTag({ params: { id: "1" }, query: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { tag: "urgent", message: "Tag removed successfully" },
      }));
    });

    it("should fail if id or tag missing", async () => {
      await removeAggregatedTag({ params: {}, query: { tag: "x" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));

      await removeAggregatedTag({ params: { id: "1" }, query: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (aggregatedActivityModel.removeTag as jest.Mock).mockRejectedValue(new Error("fail"));
      await removeAggregatedTag({ params: { id: "1" }, query: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    
    it("should fail if logs not found", async () => {
      (aggregatedActivityModel.getById as jest.Mock).mockResolvedValue(null);

      await removeAggregatedTag({ params: { id: "1" }, query: { tag: "urgent" } } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
