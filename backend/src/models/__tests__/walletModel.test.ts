/**
 * @file walletModel.test.ts
 * @description Unit tests for Firestore wallet model operations.
 */

const mockAdd = jest.fn();
const mockOrderBy = jest.fn();
const mockWhere = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn();

const mockBatch = jest.fn(() => ({
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
}));

const mockWalletLogsCollection = {
  add: mockAdd,
  orderBy: mockOrderBy,
  where: mockWhere,
  get: mockGet,
};
const mockWalletStateCollection = {
  doc: mockDoc,
};

// 🔹 mock module firebase sebelum module lain diimport
jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn((name: string) =>
      name === "walletLogs" ? mockWalletLogsCollection : mockWalletStateCollection
    ),
    batch: mockBatch,
  },
}));

// 🔹 mock DTOs
jest.mock("../../dtos/walletDTO");

import * as walletModel from "../walletModel";
import { CreateWalletLogDTO, UpdateWalletStateDTO } from "../../dtos/walletDTO";

// ───────────────────────────────────────────────
describe("walletModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWalletLog", () => {
    it("should validate, transform and add wallet log", async () => {
      const mockDtoInstance = {
        validate: jest.fn(),
        toLog: jest.fn().mockReturnValue({ account: "0xABC", timestamp: 123 }),
      };
      (CreateWalletLogDTO as jest.Mock).mockImplementation(() => mockDtoInstance);

      mockAdd.mockResolvedValue({ id: "doc1" });

      const result = await walletModel.createWalletLog({ account: "0xABC" });

      expect(CreateWalletLogDTO).toHaveBeenCalledWith({ account: "0xABC" });
      expect(mockDtoInstance.validate).toHaveBeenCalled();
      expect(mockAdd).toHaveBeenCalledWith({ account: "0xABC", timestamp: 123 });
      expect(result).toBe("doc1");
    });

    it("should throw when Firestore add fails", async () => {
      (CreateWalletLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLog: jest.fn().mockReturnValue({ account: "0xERR" }),
      }));
      mockAdd.mockRejectedValue(new Error("Firestore error"));

      await expect(walletModel.createWalletLog({ account: "0xERR" })).rejects.toThrow("Firestore error");
    });
  });

  describe("getAllWalletLogs", () => {
    it("should return mapped logs from Firestore", async () => {
      const mockDocs = [
        { data: () => ({ id: "1" }) },
        { data: () => ({ id: "2" }) },
      ];
      mockOrderBy.mockReturnValue({ get: jest.fn().mockResolvedValue({ docs: mockDocs }) });

      const result = await walletModel.getAllWalletLogs();
      expect(result).toEqual([{ id: "1" }, { id: "2" }]);
      expect(mockOrderBy).toHaveBeenCalledWith("timestamp", "desc");
    });
  });

  describe("getWalletLogsByAccount", () => {
    it("should query logs by account and return results", async () => {
      const mockDocs = [{ data: () => ({ id: "A" }) }];
      mockWhere.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      const result = await walletModel.getWalletLogsByAccount("0xABC");
      expect(result).toEqual([{ id: "A" }]);
      expect(mockWhere).toHaveBeenCalledWith("account", "==", "0xABC");
    });
  });

  describe("upsertWalletState", () => {
    it("should validate and set wallet state in Firestore", async () => {
      const mockDto = {
        validate: jest.fn(),
        toState: jest.fn().mockReturnValue({ account: "0xABC", chainId: 1 }),
      };
      (UpdateWalletStateDTO as jest.Mock).mockImplementation(() => mockDto);

      const mockSetFn = jest.fn().mockResolvedValue(undefined);
      mockDoc.mockReturnValue({ set: mockSetFn });

      await walletModel.upsertWalletState({ account: "0xABC" });

      expect(UpdateWalletStateDTO).toHaveBeenCalledWith({ account: "0xABC" });
      expect(mockSetFn).toHaveBeenCalledWith({ account: "0xABC", chainId: 1 }, { merge: true });
    });
  });

  describe("getWalletState", () => {
    it("should return wallet state if document exists", async () => {
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ account: "0xABC" }) }),
      });

      const result = await walletModel.getWalletState("0xABC");
      expect(result).toEqual({ account: "0xABC" });
    });

    it("should return null if document does not exist", async () => {
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      const result = await walletModel.getWalletState("0xDEF");
      expect(result).toBeNull();
    });
  });

  describe("deleteWalletData", () => {
    it("should delete all logs and wallet state for account", async () => {
      const mockDocs = [{ ref: "ref1" }, { ref: "ref2" }];
      mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ docs: mockDocs }) });

      const mockBatchInstance = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      (mockBatch as jest.Mock).mockReturnValue(mockBatchInstance);
      mockDoc.mockReturnValue("docRef");

      await walletModel.deleteWalletData("0xABC");

      expect(mockBatchInstance.delete).toHaveBeenCalledTimes(3);
      expect(mockBatchInstance.commit).toHaveBeenCalled();
    });
  });
});
