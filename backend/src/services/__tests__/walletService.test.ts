/**
 * @file walletService.test.ts
 * @description Unit tests for walletService using Jest.
 * Covers wallet activity logging, state management, fetching logs, updating state, and purging data.
 */

import * as walletService from "../walletService";
import * as walletModel from "../../models/walletModel";
import { UpdateWalletStateDTO } from "../../dtos/walletDTO";
import { WalletAction } from "../../types/Wallet";

// 🔹 Mock wallet model
jest.mock("../../models/walletModel");

/**
 * Unit tests for walletService
 */
describe("walletService", () => {
  const mockLogId = "log123";
  const mockWalletState = { account: "0xABC123", chainId: 1, provider: "metamask", sessionId: "sess1" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for recording wallet activity
   */
  describe("recordWalletActivity", () => {
    /**
     * Should create a wallet log without state if action is missing
     */
    it("should create a wallet log without state if action missing", async () => {
      (walletModel.createWalletLog as jest.Mock).mockResolvedValue(mockLogId);

      const result = await walletService.recordWalletActivity({ account: "0xABC123" });
      expect(walletModel.createWalletLog).toHaveBeenCalledWith({ account: "0xABC123" });
      expect(result).toEqual({ logId: mockLogId });
    });

    /**
     * Should create a wallet log and update state when action exists
     */
    it("should create a wallet log and update state when action exists", async () => {
      (walletModel.createWalletLog as jest.Mock).mockResolvedValue(mockLogId);
      (walletModel.upsertWalletState as jest.Mock).mockResolvedValue(undefined);

      const result = await walletService.recordWalletActivity({
        account: "0xABC123",
        action: WalletAction.CONNECT,
        meta: { chainId: 1, provider: "metamask", sessionId: "sess1" },
      });

      expect(walletModel.createWalletLog).toHaveBeenCalled();
      expect(walletModel.upsertWalletState).toHaveBeenCalledWith(expect.objectContaining(mockWalletState));
      expect(result).toEqual({ logId: mockLogId, state: expect.objectContaining(mockWalletState) });
    });

    /**
     * Should ignore invalid meta types and only store account
     */
    it("should ignore invalid meta types", async () => {
      (walletModel.createWalletLog as jest.Mock).mockResolvedValue(mockLogId);
      (walletModel.upsertWalletState as jest.Mock).mockResolvedValue(undefined);

      const result = await walletService.recordWalletActivity({
        account: "0xABC123",
        action: WalletAction.CONNECT,
        meta: { chainId: "not-a-number", provider: 123, sessionId: true },
      });

      expect(walletModel.upsertWalletState).toHaveBeenCalledWith(expect.objectContaining({ account: "0xABC123" }));
      expect(result).toEqual({ logId: mockLogId, state: expect.objectContaining({ account: "0xABC123" }) });
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for fetching all wallet logs
   */
  describe("fetchAllWalletLogs", () => {
    it("should call getAllWalletLogs and return logs", async () => {
      const mockLogs = [{ id: "1" }];
      (walletModel.getAllWalletLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await walletService.fetchAllWalletLogs();
      expect(result).toEqual(mockLogs);
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for fetching wallet logs by account
   */
  describe("fetchWalletLogsByAccount", () => {
    it("should call getWalletLogsByAccount and return logs", async () => {
      const mockLogs = [{ id: "1" }];
      (walletModel.getWalletLogsByAccount as jest.Mock).mockResolvedValue(mockLogs);

      const result = await walletService.fetchWalletLogsByAccount("0xABC123");
      expect(walletModel.getWalletLogsByAccount).toHaveBeenCalledWith("0xABC123");
      expect(result).toEqual(mockLogs);
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for fetching wallet state
   */
  describe("fetchWalletState", () => {
    it("should call getWalletState and return the wallet state", async () => {
      (walletModel.getWalletState as jest.Mock).mockResolvedValue(mockWalletState);
      const result = await walletService.fetchWalletState("0xABC123");
      expect(walletModel.getWalletState).toHaveBeenCalledWith("0xABC123");
      expect(result).toEqual(mockWalletState);
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for updating wallet state
   */
  describe("updateWalletState", () => {
    it("should call upsertWalletState with validated DTO", async () => {
      const validateSpy = jest.spyOn(UpdateWalletStateDTO.prototype, "validate");
      jest.spyOn(UpdateWalletStateDTO.prototype, "toState").mockReturnValue({
        account: "0xABC123",
        chainId: 1,
      });
      (walletModel.upsertWalletState as jest.Mock).mockResolvedValue(undefined);

      await walletService.updateWalletState({ account: "0xABC123", chainId: 1 });

      expect(walletModel.upsertWalletState).toHaveBeenCalledWith(
        expect.objectContaining({ account: "0xABC123", chainId: 1 })
      );
      expect(validateSpy).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────
  /**
   * Tests for purging wallet data
   */
  describe("purgeWalletData", () => {
    it("should call deleteWalletData for the given account", async () => {
      (walletModel.deleteWalletData as jest.Mock).mockResolvedValue(undefined);
      await walletService.purgeWalletData("0xABC123");
      expect(walletModel.deleteWalletData).toHaveBeenCalledWith("0xABC123");
    });
  });
});
