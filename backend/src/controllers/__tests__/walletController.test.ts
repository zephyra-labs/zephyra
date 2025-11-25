/**
 * @file walletController.test.ts
 * @description Comprehensive unit tests for walletController endpoints
 */

import type { Request, Response } from "express";
import * as WalletController from "../walletController";
import * as WalletService from "../../services/walletService";
import { CreateWalletLogDTO, UpdateWalletStateDTO } from "../../dtos/walletDTO";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/walletService");
jest.mock("../../utils/responseHelper");

function createMockResponse(): jest.Mocked<Partial<Response>> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Partial<Response>>;
}

describe("WalletController", () => {
  let res: jest.Mocked<Partial<Response>>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  const mockLog = { logId: "log123" };
  const mockState = { account: "0xABC", chainId: 1 };
  const accountParam = "0xABC";

  // --- Wallet Login ---
  describe("logWalletLogin", () => {
    it("should log wallet login successfully", async () => {
      (WalletService.recordWalletActivity as jest.Mock).mockResolvedValue(mockLog);

      const req = { body: { account: accountParam } } as Request;
      await WalletController.logWalletLogin(req, res as Response);

      expect(WalletService.recordWalletActivity).toHaveBeenCalledWith(expect.any(CreateWalletLogDTO));
      expect(success).toHaveBeenCalledWith(res, mockLog, 201);
    });

    it("should fail if account missing", async () => {
      const req = { body: {} } as Request;
      await WalletController.logWalletLogin(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.recordWalletActivity as jest.Mock).mockRejectedValue(err);

      const req = { body: { account: accountParam } } as Request;
      await WalletController.logWalletLogin(req, res as Response);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to log wallet login", 500);
    });
  });

  // --- Wallet Disconnect ---
  describe("logWalletDisconnect", () => {
    it("should log wallet disconnect successfully", async () => {
      (WalletService.recordWalletActivity as jest.Mock).mockResolvedValue(mockLog);

      const req = { body: { account: accountParam } } as Request;
      await WalletController.logWalletDisconnect(req, res as Response);

      expect(WalletService.recordWalletActivity).toHaveBeenCalledWith(expect.any(CreateWalletLogDTO));
      expect(success).toHaveBeenCalledWith(res, mockLog, 201);
    });

    it("should fail if account missing", async () => {
      const req = { body: {} } as Request;
      await WalletController.logWalletDisconnect(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.recordWalletActivity as jest.Mock).mockRejectedValue(err);

      const req = { body: { account: accountParam } } as Request;
      await WalletController.logWalletDisconnect(req, res as Response);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to log wallet disconnect", 500);
    });
  });

  // --- Wallet Logs ---
  describe("getAllWalletLogs", () => {
    it("should fetch all wallet logs", async () => {
      (WalletService.fetchAllWalletLogs as jest.Mock).mockResolvedValue([mockLog]);
      await WalletController.getAllWalletLogs({} as Request, res as Response);
      expect(WalletService.fetchAllWalletLogs).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(res, [mockLog], 200);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.fetchAllWalletLogs as jest.Mock).mockRejectedValue(err);
      await WalletController.getAllWalletLogs({} as Request, res as Response);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch wallet logs", 500);
    });
  });

  describe("getWalletLogs", () => {
    it("should fetch wallet logs by account", async () => {
      (WalletService.fetchWalletLogsByAccount as jest.Mock).mockResolvedValue([mockLog]);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletLogs(req, res as Response);
      expect(WalletService.fetchWalletLogsByAccount).toHaveBeenCalledWith(accountParam);
      expect(success).toHaveBeenCalledWith(res, [mockLog], 200);
    });

    it("should fail if account missing", async () => {
      const req = { params: {} } as unknown as Request;
      await WalletController.getWalletLogs(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should fail if logs not found", async () => {
      (WalletService.fetchWalletLogsByAccount as jest.Mock).mockResolvedValue(null);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletLogs(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Wallet logs not found", 404);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.fetchWalletLogsByAccount as jest.Mock).mockRejectedValue(err);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletLogs(req, res as Response);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch wallet logs for account", 500);
    });
  });

  // --- Wallet State ---
  describe("getWalletState", () => {
    it("should return wallet state", async () => {
      (WalletService.fetchWalletState as jest.Mock).mockResolvedValue(mockState);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletState(req, res as Response);
      expect(WalletService.fetchWalletState).toHaveBeenCalledWith(accountParam);
      expect(success).toHaveBeenCalledWith(res, mockState, 200);
    });

    it("should fail if account missing", async () => {
      const req = { params: {} } as unknown as Request;
      await WalletController.getWalletState(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should fail if state not found", async () => {
      (WalletService.fetchWalletState as jest.Mock).mockResolvedValue(null);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletState(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Wallet state not found", 404);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.fetchWalletState as jest.Mock).mockRejectedValue(err);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.getWalletState(req, res as Response);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch wallet state", 500);
    });
  });

  // --- Update Wallet State ---
  describe("updateWalletStateController", () => {
    it("should update wallet state successfully", async () => {
      (WalletService.updateWalletState as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { account: accountParam }, body: { chainId: 1 } } as unknown as Request;
      await WalletController.updateWalletStateController(req, res as Response);
      expect(WalletService.updateWalletState).toHaveBeenCalledWith(expect.any(UpdateWalletStateDTO));
      expect(success).toHaveBeenCalledWith(res, { message: "Wallet state updated" }, 200);
    });

    it("should fail if account missing", async () => {
      const req = { params: {}, body: { chainId: 1 } } as unknown as Request;
      await WalletController.updateWalletStateController(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.updateWalletState as jest.Mock).mockRejectedValue(err);
      const req = { params: { account: accountParam }, body: { chainId: 1 } } as unknown as Request;
      await WalletController.updateWalletStateController(req, res as Response);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update wallet state", 500);
    });
  });

  // --- Delete Wallet ---
  describe("deleteWalletController", () => {
    it("should delete wallet data successfully", async () => {
      (WalletService.purgeWalletData as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.deleteWalletController(req, res as Response);
      expect(WalletService.purgeWalletData).toHaveBeenCalledWith(accountParam);
      expect(success).toHaveBeenCalledWith(res, { message: "Wallet data deleted" }, 200);
    });

    it("should fail if account missing", async () => {
      const req = { params: {} } as unknown as Request;
      await WalletController.deleteWalletController(req, res as Response);
      expect(failure).toHaveBeenCalledWith(res, "Account parameter is required", 400);
    });

    it("should handle service error", async () => {
      const err = new Error("fail");
      (WalletService.purgeWalletData as jest.Mock).mockRejectedValue(err);
      const req = { params: { account: accountParam } } as unknown as Request;
      await WalletController.deleteWalletController(req, res as Response);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to delete wallet data", 500);
    });
  });
});
