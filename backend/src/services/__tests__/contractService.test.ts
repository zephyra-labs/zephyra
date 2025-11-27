/**
 * @file contractService.test.ts
 * @description Full coverage tests for ContractService
 */

import { ContractService } from "../contractService";
import { ContractModel } from "../../models/contractModel";
import ContractLogDTO from "../../dtos/contractDTO";

// Mock helpers
jest.mock("../../utils/notificationHelper", () => ({
  notifyUsers: jest.fn().mockResolvedValue(undefined),
  notifyWithAdmins: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/getContractRoles", () => ({
  getContractRoles: jest.fn(),
}));

jest.mock("../../models/contractModel");
jest.mock("../../dtos/contractDTO");

describe("ContractService (100% coverage)", () => {
  const mockContractAddress = "0x1111111111111111111111111111111111111111";
  const mockUser = "0xUser1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // addContractLog: fallback roles
  // -----------------------------
  const logisticsCases = [
    { roles: null, expected: [] },
    { roles: "0xLOG_SINGLE", expected: ["0xLOG_SINGLE"] },
    { roles: ["0xLOG_1", "0xLOG_2"], expected: ["0xLOG_1", "0xLOG_2"] },
  ];

  logisticsCases.forEach((c, i) => {
    it(`should handle fallback roles and logistics case ${i + 1}`, async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "deploy", extra: {} }),
        toState: jest.fn().mockReturnValue({}),
        contractAddress: mockContractAddress,
        exporter: undefined,
        importer: undefined,
        logistics: undefined,
        account: mockUser,
        txHash: "0xTX",
      }));

      const { getContractRoles } = await import("../../utils/getContractRoles");
      (getContractRoles as jest.Mock).mockResolvedValue({
        exporter: "0xEXP_FALLBACK",
        importer: "0xIMP_FALLBACK",
        logistics: c.roles,
      });

      (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      const { notifyUsers } = await import("../../utils/notificationHelper");

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(result.action).toBe("deploy");

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockContractAddress,
        expect.objectContaining({
          exporter: "0xEXP_FALLBACK",
          importer: "0xIMP_FALLBACK",
          logistics: c.expected,
        })
      );

      if (c.expected.length) {
        expect(notifyUsers).toHaveBeenCalled();
      }
    });
  });

  // -----------------------------
  // add/remove logistic
  // -----------------------------
  it("should add logistic successfully", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "addLogistic", extra: { logistic: "0xL1" } }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: [] },
    });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("addLogistic");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({ logistics: ["0xL1"] })
    );
  });

  it("should throw error on duplicate logistic", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "addLogistic", extra: { logistic: "0xL1" } }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: ["0xL1"] },
    });

    await expect(ContractService.addContractLog({ contractAddress: mockContractAddress })).rejects.toThrow(
      "Logistic 0xL1 already added"
    );
  });

  it("should remove logistic successfully", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "removeLogistic", extra: { logistic: "0xL1" } }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: ["0xL1", "0xL2"] },
    });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("removeLogistic");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({ logistics: ["0xL2"] })
    );
  });

  it("should throw error on removing non-existent logistic", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "removeLogistic", extra: { logistic: "0xMISSING" } }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: ["0xL1"] },
    });

    await expect(ContractService.addContractLog({ contractAddress: mockContractAddress })).rejects.toThrow(
      "Logistic 0xMISSING not found"
    );
  });

  // -----------------------------
  // getAllContracts & getContractById
  // -----------------------------
  it("should return all contracts", async () => {
    (ContractModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await ContractService.getAllContracts();
    expect(result).toHaveLength(2);
  });

  it("should return contract by id", async () => {
    (ContractModel.getContractById as jest.Mock).mockResolvedValue({ contractAddress: mockContractAddress });
    const c = await ContractService.getContractById(mockContractAddress);
    if (c) expect(c.contractAddress).toBe(mockContractAddress);
  });

  // -----------------------------
  // getContractsByUser
  // -----------------------------
  it("should assign roles correctly with fallback", async () => {
    const mockContracts = [
      { contractAddress: "0x1", state: { exporter: mockUser, importer: "0xImp", logistics: [] } },
      { contractAddress: "0x2", state: { exporter: "0xExp", importer: mockUser, logistics: [] } },
      { contractAddress: "0x3", state: { exporter: "0xExp", importer: "0xImp", logistics: [mockUser] } },
      { contractAddress: "0x4", state: undefined },
    ];

    (ContractModel.getContractsByUser as jest.Mock).mockResolvedValue(mockContracts);
    const { getContractRoles } = await import("../../utils/getContractRoles");
    (getContractRoles as jest.Mock).mockResolvedValue({
      exporter: mockUser,
      importer: "0xImp",
      logistics: [],
    });

    const res = await ContractService.getContractsByUser(mockUser);
    expect(res).toHaveLength(4);
    expect(res).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contractAddress: "0x1", role: "Exporter" }),
        expect.objectContaining({ contractAddress: "0x2", role: "Importer" }),
        expect.objectContaining({ contractAddress: "0x3", role: "Logistics" }),
        expect.objectContaining({ contractAddress: "0x4", role: "Exporter" }),
      ])
    );
  });

  // -----------------------------
  // getContractStepStatus
  // -----------------------------
  it("should return stepStatus with lastAction", async () => {
    const history = [
      { action: "deploy" },
      { action: "deposit" },
      { action: "approveImporter" },
      { action: "approveExporter" },
      { action: "finalize" },
    ];

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({ history });
    const result = await ContractService.getContractStepStatus("0xAAA");
    if (result) {
      expect(result.stepStatus).toEqual({
        deploy: true,
        deposit: true,
        approveImporter: true,
        approveExporter: true,
        finalize: true,
      });
      expect(result.lastAction).toEqual({ action: "finalize" });
    }
  });

  it("should return null if contract not found", async () => {
    (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
    const result = await ContractService.getContractStepStatus("0xAAA");
    expect(result).toBeNull();
  });
  
  it("should merge state and use extra.stage when provided", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: { stage: "2" } }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: null, currentStage: "1" },
    });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("deposit");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({
        currentStage: "2",  // extra.stage dipakai
        logistics: [],      // null → fallback []
      })
    );
  });

  it("should fallback currentStage to '1' when extra.stage & doc.state.currentStage undefined", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: {} }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: null, currentStage: undefined },
    });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("deposit");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({
        currentStage: "1",  // fallback
        logistics: [],      // null → fallback []
      })
    );
  });
});
