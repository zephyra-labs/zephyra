/**
 * @file tradeService.test.ts
 * @description Unit tests for TradeService with fixed types, mocks, and valid TradeStatus/roles.
 */

// 🔹 Manual mock untuk notifyUsers agar bisa dipanggil
jest.mock("../../utils/notificationHelper", () => ({
  notifyUsers: jest.fn(),
}));

import { TradeService } from "../tradeService";
import { TradeModel } from "../../models/tradeModel";
import { notifyUsers } from "../../utils/notificationHelper"; // sekarang sudah pasti jest.fn()
import type { TradeParticipant, TradeRecord, TradeStatus } from "../../types/Trade";

// 🔹 Mock model
jest.mock("../../models/tradeModel");

describe("TradeService", () => {
  const mockParticipant: TradeParticipant = {
    address: "0xABC",
    role: "exporter",
    kycVerified: true,
    walletConnected: true,
  };

  const mockTrade: TradeRecord = {
    id: "trade1",
    participants: [mockParticipant],
    status: "draft",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (notifyUsers as jest.Mock).mockResolvedValue(undefined);
  });

  describe("createTrade", () => {
    it("should create a trade record with participants", async () => {
      (TradeModel.upsertTradeRecord as jest.Mock).mockResolvedValue(undefined);

      const result = await TradeService.createTrade([mockParticipant]);

      expect(TradeModel.upsertTradeRecord).toHaveBeenCalledWith(expect.objectContaining({
        participants: [mockParticipant],
        status: "draft",
      }));
      expect(result.participants).toContainEqual(mockParticipant);
      expect(result.status).toBe("draft");
    });
  });

  describe("addParticipant", () => {
    it("should add a new participant and notify them", async () => {
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue({ ...mockTrade, participants: [] });
      (TradeModel.upsertTradeRecord as jest.Mock).mockResolvedValue(undefined);

      const result = await TradeService.addParticipant("trade1", mockParticipant);

      expect(result.participants).toContainEqual(mockParticipant);
      expect(TradeModel.upsertTradeRecord).toHaveBeenCalled();
      expect(notifyUsers).toHaveBeenCalledWith(
        [mockParticipant.address],
        expect.objectContaining({ title: "Added to trade" }),
        "system"
      );
    });

    it("should throw if trade not found", async () => {
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue(null);

      await expect(TradeService.addParticipant("tradeX", mockParticipant))
        .rejects.toThrow("Trade not found");
    });

    it("should throw if participant already exists", async () => {
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue({ ...mockTrade, participants: [mockParticipant] });

      await expect(TradeService.addParticipant("trade1", mockParticipant))
        .rejects.toThrow("Participant already exists");
    });
  });

  describe("assignRole", () => {
    it("should update a participant role", async () => {
      const updatedParticipant = { ...mockParticipant, role: "logistics" };
      (TradeModel.updateParticipantRole as jest.Mock).mockResolvedValue([updatedParticipant]);

      const result = await TradeService.assignRole("trade1", mockParticipant.address, "logistics");

      expect(result[0].role).toBe("logistics");
      expect(TradeModel.updateParticipantRole).toHaveBeenCalledWith("trade1", mockParticipant.address, "logistics");
    });
  });

  describe("updateStatus", () => {
    it("should update trade status and notify participants", async () => {
      const updatedTrade = { ...mockTrade };
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue(updatedTrade);
      (TradeModel.updateTradeStatus as jest.Mock).mockResolvedValue(undefined);

      const newStatus: TradeStatus = "inProgress";
      const result = await TradeService.updateStatus("trade1", newStatus);

      expect(result.status).toBe(newStatus);
      expect(TradeModel.updateTradeStatus).toHaveBeenCalledWith("trade1", newStatus);
      expect(notifyUsers).toHaveBeenCalledWith(
        [mockParticipant.address],
        expect.objectContaining({ title: "Trade status updated" }),
        "system"
      );
    });

    it("should throw if trade not found", async () => {
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue(null);

      await expect(TradeService.updateStatus("tradeX", "completed"))
        .rejects.toThrow("Trade not found");
    });
  });

  describe("getAllTrades", () => {
    it("should return all trades", async () => {
      (TradeModel.getAllTrades as jest.Mock).mockResolvedValue([mockTrade]);

      const result = await TradeService.getAllTrades();
      expect(result).toContain(mockTrade);
      expect(TradeModel.getAllTrades).toHaveBeenCalled();
    });
  });

  describe("getTradeById", () => {
    it("should return trade by ID", async () => {
      (TradeModel.getTradeById as jest.Mock).mockResolvedValue(mockTrade);

      const result = await TradeService.getTradeById("trade1");
      expect(result).toEqual(mockTrade);
      expect(TradeModel.getTradeById).toHaveBeenCalledWith("trade1");
    });
  });

  describe("getTradesByParticipant", () => {
    it("should return trades involving a participant", async () => {
      (TradeModel.getTradesByParticipant as jest.Mock).mockResolvedValue([mockTrade]);

      const result = await TradeService.getTradesByParticipant(mockParticipant.address);
      expect(result).toContain(mockTrade);
      expect(TradeModel.getTradesByParticipant).toHaveBeenCalledWith(mockParticipant.address);
    });
  });
});
