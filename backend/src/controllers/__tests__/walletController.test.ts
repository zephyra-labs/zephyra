// src/controllers/__tests__/walletController.test.ts
import type { Request, Response } from "express";
import * as WalletController from "../walletController";
import * as WalletService from "../../services/walletService";
import { CreateWalletLogDTO, UpdateWalletStateDTO } from "../../dtos/walletDTO";

// Mock seluruh service
jest.mock("../../services/walletService");

describe("walletController", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("logWalletLogin", () => {
    it("should log wallet login", async () => {
      const mockReq = { body: { account: "0xABC" } } as Request;
      (WalletService.recordWalletActivity as jest.Mock).mockResolvedValue({ logId: "log123" });

      await WalletController.logWalletLogin(mockReq, mockRes as Response);

      expect(WalletService.recordWalletActivity).toHaveBeenCalledWith(expect.any(CreateWalletLogDTO));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { logId: "log123" },
      });
    });

    it("should return failure if account missing", async () => {
      const mockReq = { body: {} } as Request;

      await WalletController.logWalletLogin(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Account parameter is required",
      });
    });
  });

  describe("logWalletDisconnect", () => {
    it("should log wallet disconnect", async () => {
      const mockReq = { body: { account: "0xDEF" } } as Request;
      (WalletService.recordWalletActivity as jest.Mock).mockResolvedValue({ logId: "log456" });

      await WalletController.logWalletDisconnect(mockReq, mockRes as Response);

      expect(WalletService.recordWalletActivity).toHaveBeenCalledWith(expect.any(CreateWalletLogDTO));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { logId: "log456" },
      });
    });
  });

  describe("getAllWalletLogs", () => {
    it("should return all logs", async () => {
      const logs = [{ id: "1" }];
      (WalletService.fetchAllWalletLogs as jest.Mock).mockResolvedValue(logs);

      await WalletController.getAllWalletLogs({} as Request, mockRes as Response);

      expect(WalletService.fetchAllWalletLogs).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logs,
      });
    });
  });

  describe("getWalletLogs", () => {
    it("should fetch logs by account", async () => {
      const mockExecutor = "0xABC";
      const logs = [{ id: "2" }];
      const mockReq = { params: { account: mockExecutor } } as unknown as Request;
      (WalletService.fetchWalletLogsByAccount as jest.Mock).mockResolvedValue(logs);

      await WalletController.getWalletLogs(mockReq, mockRes as Response);

      expect(WalletService.fetchWalletLogsByAccount).toHaveBeenCalledWith(mockExecutor);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: logs,
      });
    });
  });

  describe("getWalletState", () => {
    it("should return wallet state", async () => {
      const mockExecutor = "0xABC123";
      const state = { account: mockExecutor, chainId: 1 };
      const mockReq = { params: { account: mockExecutor } } as unknown as Request;
      (WalletService.fetchWalletState as jest.Mock).mockResolvedValue(state);

      await WalletController.getWalletState(mockReq, mockRes as Response);

      expect(WalletService.fetchWalletState).toHaveBeenCalledWith(mockExecutor);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: state,
      });
    });

    it("should return 404 if state not found", async () => {
      const mockExecutor = "0xABC123";
      const mockReq = { params: { account: mockExecutor } } as unknown as Request;
      (WalletService.fetchWalletState as jest.Mock).mockResolvedValue(null);

      await WalletController.getWalletState(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Wallet state not found",
      });
    });
  });

  describe("updateWalletStateController", () => {
    it("should update wallet state", async () => {
      const mockReq = {
        params: { account: "0xAAA" },
        body: { chainId: 1 },
      } as unknown as Request;
      (WalletService.updateWalletState as jest.Mock).mockResolvedValue(undefined);

      await WalletController.updateWalletStateController(mockReq, mockRes as Response);

      expect(WalletService.updateWalletState).toHaveBeenCalledWith(expect.any(UpdateWalletStateDTO));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: "Wallet state updated" },
      });
    });
  });

  describe("deleteWalletController", () => {
    it("should delete wallet data", async () => {
      const mockExecutor = "0xAAA";
      const mockReq = { params: { account: mockExecutor } } as unknown as Request;
      (WalletService.purgeWalletData as jest.Mock).mockResolvedValue(undefined);

      await WalletController.deleteWalletController(mockReq, mockRes as Response);

      expect(WalletService.purgeWalletData).toHaveBeenCalledWith(mockExecutor);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: "Wallet data deleted" },
      });
    });
  });
});
