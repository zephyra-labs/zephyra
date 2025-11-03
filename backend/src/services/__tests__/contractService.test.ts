/**
 * @file contractService.test.ts
 * @description Unit tests for ContractService
 */

import { ContractService } from "../contractService";
import { ContractModel } from "../../models/contractModel";
import ContractLogDTO from "../../dtos/contractDTO";

// Mock named exports from utils
jest.mock("../../utils/notificationHelper", () => ({
  notifyUsers: jest.fn().mockResolvedValue(undefined),
  notifyWithAdmins: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/getContractRoles", () => ({
  getContractRoles: jest.fn(),
}));

jest.mock("../../models/contractModel");

jest.mock("../../dtos/contractDTO");

describe("ContractService", () => {
  const mockContractAddress = "0x1111111111111111111111111111111111111111";
  const mockUser = "0xUser1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addContractLog", () => {
    it("should add a new log and update state for first deployment", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "deploy", extra: { exporter: mockUser } }),
        toState: jest.fn().mockReturnValue({ exporter: mockUser }),
        contractAddress: mockContractAddress,
        action: "deploy",
        account: mockUser,
        txHash: "0xTxHash",
        exporter: mockUser,
        importer: undefined,
        logistics: undefined,
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);
      const { getContractRoles } = await import("../../utils/getContractRoles");
      (getContractRoles as jest.Mock).mockResolvedValue({ exporter: mockUser, importer: "0xOther", logistics: [] });

      const { notifyUsers, notifyWithAdmins } = await import("../../utils/notificationHelper");

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(result.action).toBe("deploy");
      expect(ContractModel.addContractLog).toHaveBeenCalled();
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(notifyUsers).toHaveBeenCalled();
    });

    it("should handle addLogistic action", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "addLogistic", extra: { logistic: "0xLogistic1" } }),
        toState: jest.fn().mockReturnValue({ exporter: mockUser }),
        contractAddress: mockContractAddress,
        action: "addLogistic",
        account: mockUser,
        txHash: "0xTxHash",
        exporter: mockUser,
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({ state: { exporter: mockUser, importer: "0xOther", logistics: [] } });
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(result.action).toBe("addLogistic");
      expect(ContractModel.addContractLog).toHaveBeenCalled();
    });

    it("should throw error if logistic already exists", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "addLogistic", extra: { logistic: "0xLogistic1" } }),
        toState: jest.fn().mockReturnValue({ exporter: mockUser }),
        contractAddress: mockContractAddress,
        action: "addLogistic",
        account: mockUser,
        txHash: "0xTxHash",
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({ state: { exporter: mockUser, importer: "0xOther", logistics: ["0xLogistic1"] } });

      await expect(ContractService.addContractLog({ contractAddress: mockContractAddress }))
        .rejects
        .toThrow("Logistic 0xLogistic1 already added");
    });
  });

  describe("getAllContracts", () => {
    it("should return all contracts", async () => {
      (ContractModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: "1" }, { id: "2" }]);
      const result = await ContractService.getAllContracts();
      expect(result.length).toBe(2);
    });
  });

  describe("getContractById", () => {
    it("should return contract by address", async () => {
      (ContractModel.getContractById as jest.Mock).mockResolvedValue({ contractAddress: "1" });
      const result = await ContractService.getContractById("1");
      expect(result).not.toBeNull();
      expect(result!.contractAddress).toBe("1");
    });
  });

  describe("getContractsByUser", () => {
    it("should return contracts with roles", async () => {
      const mockContracts = [
        { contractAddress: "0x1", state: { exporter: mockUser, importer: "0xOther", logistics: [] } },
        { contractAddress: "0x2", state: { exporter: "0xOther", importer: mockUser, logistics: [] } },
        { contractAddress: "0x3", state: { exporter: "0xOther", importer: "0xOther", logistics: [mockUser] } },
      ];

      (ContractModel.getContractsByUser as jest.Mock).mockResolvedValue(mockContracts);

      const result = await ContractService.getContractsByUser(mockUser);

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ contractAddress: "0x1", role: "Exporter" }),
        expect.objectContaining({ contractAddress: "0x2", role: "Importer" }),
        expect.objectContaining({ contractAddress: "0x3", role: "Logistics" }),
      ]));
    });
  });

  describe("getContractStepStatus", () => {
    it("should return stepStatus and lastAction", async () => {
      const history = [
        { action: "deploy" },
        { action: "deposit" },
        { action: "approveImporter" },
        { action: "finalize" },
      ];
      (ContractModel.getContractById as jest.Mock).mockResolvedValue({ history });

      const result = await ContractService.getContractStepStatus("0x1");
      expect(result?.stepStatus.deploy).toBe(true);
      expect(result?.stepStatus.deposit).toBe(true);
      expect(result?.stepStatus.approveImporter).toBe(true);
      expect(result?.stepStatus.finalize).toBe(true);
      expect(result?.lastAction).toEqual({ action: "finalize" });
    });

    it("should return null if contract not found", async () => {
      (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
      const result = await ContractService.getContractStepStatus("0x1");
      expect(result).toBeNull();
    });
  });
});
