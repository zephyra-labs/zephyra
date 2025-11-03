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
      expect(success).toHaveBeenCalledWith(mockRes, mockTrades);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (TradeService.getAllTrades as jest.Mock).mockRejectedValue(err);

      await TradeController.fetchAllTrades({} as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch trades");
    });
  });

  describe("getTradeById", () => {
    it("should fetch trade by id", async () => {
      (TradeService.getTradeById as jest.Mock).mockResolvedValue(mockTrade);

      await TradeController.getTradeById({ params: { id: "trade1" } } as unknown as Request, mockRes);

      expect(TradeService.getTradeById).toHaveBeenCalledWith("trade1");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade);
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

      expect(failure).toHaveBeenCalledWith(mockRes, "Participants are required");
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
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade);
    });

    it("should fail if participant missing", async () => {
      await TradeController.addParticipant(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Participant data is required");
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
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade.participants);
    });

    it("should fail if address or role missing", async () => {
      await TradeController.assignRole(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Participant address and role are required");
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
      expect(success).toHaveBeenCalledWith(mockRes, mockTrade);
    });

    it("should fail if status missing", async () => {
      await TradeController.updateStatus(
        { params: { id: "trade1" }, body: {} } as unknown as Request,
        mockRes
      );

      expect(failure).toHaveBeenCalledWith(mockRes, "Status is required");
    });
  });

  describe("getMyTrades", () => {
    it("should fetch trades for authenticated user", async () => {
      const mockReq = { user: { address: "0xUSER1" } } as AuthRequest;
      (TradeService.getTradesByParticipant as jest.Mock).mockResolvedValue(mockTrades);

      await TradeController.getMyTrades(mockReq, mockRes);

      expect(TradeService.getTradesByParticipant).toHaveBeenCalledWith("0xUSER1");
      expect(success).toHaveBeenCalledWith(mockRes, mockTrades);
    });

    it("should fail if user not authenticated", async () => {
      const mockReq = { user: null } as unknown as AuthRequest;

      await TradeController.getMyTrades(mockReq, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Unauthorized", 401);
    });
  });
});
