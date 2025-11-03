/**
 * @file walletController.test.ts
 * @description Unit tests for walletController endpoints
 */

import type { Request, Response } from "express";
import * as WalletController from "../walletController";
import * as WalletService from "../../services/walletService";
import { CreateWalletLogDTO, UpdateWalletStateDTO } from "../../dtos/walletDTO";

jest.mock("../../services/walletService");

describe("WalletController", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  /**
   * @group Wallet Login
   */
  describe("logWalletLogin", () => {
    /**
     * Should successfully log a wallet login event and return 201
     */
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

    /**
     * Should return failure response if account parameter is missing
     */
    it("should return failure if account missing", async () => {
      const mockReq = { body: {} } as Request;

      await WalletController.logWalletLogin(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Account parameter is required",
      });
    });
  });

  /**
   * @group Wallet Disconnect
   */
  describe("logWalletDisconnect", () => {
    /**
     * Should successfully log a wallet disconnect event and return 201
     */
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

  /**
   * @group Wallet Logs
   */
  describe("getAllWalletLogs", () => {
    /**
     * Should fetch all wallet logs and return them
     */
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
    /**
     * Should fetch wallet logs for a specific account
     */
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

  /**
   * @group Wallet State
   */
  describe("getWalletState", () => {
    /**
     * Should return the current wallet state for a specific account
     */
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

    /**
     * Should return 404 if wallet state not found
     */
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

  /**
   * @group Update Wallet State
   */
  describe("updateWalletStateController", () => {
    /**
     * Should update wallet state for a specific account
     */
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

  /**
   * @group Delete Wallet
   */
  describe("deleteWalletController", () => {
    /**
     * Should delete wallet data for a specific account
     */
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
