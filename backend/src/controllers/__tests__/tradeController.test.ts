/**
 * @file tradeController.test.ts
 * @description Unit tests for TradeController
 */

import { Request } from "express";
import { TradeController } from "../tradeController";
import { TradeService } from "../../services/tradeService";
import { success, failure, handleError } from "../../utils/responseHelper";
import type { AuthRequest } from "../../middlewares/authMiddleware";

jest.mock("../../services/tradeService");
jest.mock("../../utils/responseHelper");

/**
 * Helper to create a fully type-safe mocked Express response
 */
function createMockResponse(): jest.Mocked<Partial<import("express").Response>> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<import("express").Response>;
}

describe("TradeController", () => {
  let mockRes: jest.Mocked<import("express").Response>;
  const mockTrade = { id: "trade1", participants: [{ address: "0xUSER1", role: "initiator" }] };
  const mockTrades = [mockTrade];

  beforeEach(() => {
    mockRes = createMockResponse() as jest.Mocked<import("express").Response>;
    jest.clearAllMocks();
  });

  describe("fetchAllTrades", () => {
    it("should fetch all trades", async () => {
      (TradeService.getAllTrades as jest.Mock).mockResolvedValue(mockTrades);

      await TradeController.fetchAllTrades({} as Request, mockRes);

      expect(TradeService.getAllTrades).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockTrades, 200);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (TradeService.getAllTrades as jest.Mock).mockRejectedValue(err);

      await TradeController.fetchAllTrades({} as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch trades", 500);
    });
  });

  describe("getTradeById", () => {
    it("should fetch trade by id", async () => {
      (TradeService.getTradeById as jest.Mock).mockResolvedValue(mockTrade);

      await TradeController.getTradeById({ params: { id: "trade1" } } as unknown as Request, mockRes);

      expect(TradeService.getTradeById).toHaveBeenCalledWith("trade1");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade, 200);
    });

    it("should return 404 if trade not found", async () => {
      (TradeService.getTradeById as jest.Mock).mockResolvedValue(null);

      await TradeController.getTradeById({ params: { id: "trade999" } } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Trade not found", 404);
    });
  });

  describe("createTrade", () => {
    it("should create a trade", async () => {
      (TradeService.createTrade as jest.Mock).mockResolvedValue(mockTrade);

      await TradeController.createTrade({ body: { participants: ["0xUSER1"] } } as unknown as Request, mockRes);

      expect(TradeService.createTrade).toHaveBeenCalledWith(["0xUSER1"]);
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade, 201);
    });

    it("should fail if participants missing", async () => {
      await TradeController.createTrade({ body: {} } as unknown as Request, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Participants are required", 400);
    });
  });

  describe("addParticipant", () => {
    it("should add a participant", async () => {
      (TradeService.addParticipant as jest.Mock).mockResolvedValue(mockTrade);

      await TradeController.addParticipant(
        { params: { id: "trade1" }, body: { address: "0xUSER2" } } as unknown as Request,
        mockRes
      );

      expect(TradeService.addParticipant).toHaveBeenCalledWith("trade1", { address: "0xUSER2" });
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade, 200);
    });

    it("should fail if participant missing", async () => {
      await TradeController.addParticipant(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Participant data is required", 400);
    });
  });

  describe("assignRole", () => {
    it("should assign role", async () => {
      (TradeService.assignRole as jest.Mock).mockResolvedValue(mockTrade.participants);

      await TradeController.assignRole(
        { params: { id: "trade1" }, body: { address: "0xUSER1", role: "approver" } } as unknown as Request,
        mockRes
      );

      expect(TradeService.assignRole).toHaveBeenCalledWith("trade1", "0xUSER1", "approver");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade.participants, 200);
    });

    it("should fail if address or role missing", async () => {
      await TradeController.assignRole(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Participant address and role are required", 400);
    });
  });

  describe("updateStatus", () => {
    it("should update status", async () => {
      (TradeService.updateStatus as jest.Mock).mockResolvedValue(mockTrade);

      await TradeController.updateStatus(
        { params: { id: "trade1" }, body: { status: "completed" } } as unknown as Request,
        mockRes
      );

      expect(TradeService.updateStatus).toHaveBeenCalledWith("trade1", "completed");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade, 200);
    });

    it("should fail if status missing", async () => {
      await TradeController.updateStatus(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Status is required", 400);
    });
  });

  describe("getMyTrades", () => {
    it("should fetch trades for authenticated user", async () => {
      const mockReq = { user: { address: "0xUSER1" } } as AuthRequest;
      (TradeService.getTradesByParticipant as jest.Mock).mockResolvedValue(mockTrades);

      await TradeController.getMyTrades(mockReq, mockRes);

      expect(TradeService.getTradesByParticipant).toHaveBeenCalledWith("0xUSER1");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrades, 200);
    });

    it("should fail if user not authenticated", async () => {
      const mockReq = { user: null } as unknown as AuthRequest;

      await TradeController.getMyTrades(mockReq, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Missing or invalid Authorization header", 401);
    });
  });
  
  describe("TradeController error handling", () => {
    let mockRes: jest.Mocked<import("express").Response>;

    beforeEach(() => {
      mockRes = createMockResponse() as jest.Mocked<import("express").Response>;
      jest.clearAllMocks();
    });

    it("fetchAllTrades should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.getAllTrades as jest.Mock).mockRejectedValue(err);

      await TradeController.fetchAllTrades({} as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch trades", 500);
    });

    it("getTradeById should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.getTradeById as jest.Mock).mockRejectedValue(err);

      await TradeController.getTradeById({ params: { id: "trade1" } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch trade", 500);
    });

    it("createTrade should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.createTrade as jest.Mock).mockRejectedValue(err);

      await TradeController.createTrade({ body: { participants: ["0xUSER1"] } } as unknown as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to create trade", 500);
    });

    it("addParticipant should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.addParticipant as jest.Mock).mockRejectedValue(err);

      await TradeController.addParticipant(
        { params: { id: "trade1" }, body: { address: "0xUSER2" } } as unknown as Request,
        mockRes
      );

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to add participant", 500);
    });

    it("updateStatus should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.updateStatus as jest.Mock).mockRejectedValue(err);

      await TradeController.updateStatus(
        { params: { id: "trade1" }, body: { status: "completed" } } as unknown as Request,
        mockRes
      );

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to update trade status", 500);
    });

    it("getMyTrades should handle service error", async () => {
      const err = new Error("fail");
      const mockReq = { user: { address: "0xUSER1" } } as AuthRequest;
      (TradeService.getTradesByParticipant as jest.Mock).mockRejectedValue(err);

      await TradeController.getMyTrades(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch user trades", 500);
    });
    
    it("assignRole should handle service error", async () => {
      const err = new Error("fail");
      (TradeService.assignRole as jest.Mock).mockRejectedValue(err);

      await TradeController.assignRole(
        { params: { id: "trade1" }, body: { address: "0xUSER1", role: "approver" } } as unknown as Request,
        mockRes
      );

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to assign role", 500);
    });
  });
  
  describe("TradeController missing parameter handling", () => {
    let mockRes: jest.Mocked<import("express").Response>;

    beforeEach(() => {
      mockRes = createMockResponse() as jest.Mocked<import("express").Response>;
      jest.clearAllMocks();
    });

    it("getTradeById should return 422 if id missing", async () => {
      await TradeController.getTradeById({ params: {} } as unknown as Request, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "Missing id parameter", 422);
    });

    it("addParticipant should return 422 if id missing", async () => {
      await TradeController.addParticipant({ params: {}, body: { address: "0xUSER" } } as unknown as Request, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "Missing trade id parameter", 422);
    });

    it("assignRole should return 422 if id missing", async () => {
      await TradeController.assignRole({ params: {}, body: { address: "0xUSER", role: "approver" } } as unknown as Request, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "Missing trade id parameter", 422);
    });

    it("updateStatus should return 422 if id missing", async () => {
      await TradeController.updateStatus({ params: {}, body: { status: "completed" } } as unknown as Request, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "Missing trade id parameter", 422);
    });

    it("getMyTrades should return 404 if no trades found", async () => {
      const mockReq = { user: { address: "0xUSER1" } } as AuthRequest;
      (TradeService.getTradesByParticipant as jest.Mock).mockResolvedValue([]);

      await TradeController.getMyTrades(mockReq, mockRes);
      expect(failure).toHaveBeenCalledWith(mockRes, "No trades found for user", 404);
    });
  });
});
