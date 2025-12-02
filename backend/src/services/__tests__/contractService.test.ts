/**
 * @file contractService.test.ts
 * @description Full coverage tests for ContractService (refactored)
 */

import { ContractService } from "../contractService";
import { ContractModel } from "../../models/contractModel";
import ContractLogDTO from "../../dtos/contractDTO";
import type { ContractLogEntry } from "../../types/Contract";

import { notifyUsers, notifyWithAdmins } from "../../utils/notificationHelper";
import { getContractRoles } from "../../utils/getContractRoles";

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

  const setupDTO = (action: string, extra: object = {}) => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action, extra }),
      toState: jest.fn().mockReturnValue({}),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const logisticsCases = [
    { roles: null, expected: [] },
    { roles: "0xLOG_SINGLE", expected: ["0xLOG_SINGLE"] },
    { roles: ["0xLOG_1", "0xLOG_2"], expected: ["0xLOG_1", "0xLOG_2"] },
  ];

  logisticsCases.forEach((c, i) => {
    it(`handles fallback roles case ${i + 1}`, async () => {
      setupDTO("deploy");

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

  const logisticsScenarios = [
    {
      action: "addLogistic",
      initial: [],
      logistic: "0xL1",
      expected: ["0xL1"],
    },
    {
      action: "removeLogistic",
      initial: ["0xL1", "0xL2"],
      logistic: "0xL1",
      expected: ["0xL2"],
    },
  ];

  logisticsScenarios.forEach(({ action, initial, logistic, expected }) => {
    it(`should ${action} successfully`, async () => {
      setupDTO(action, { logistic });

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: mockUser, importer: "0xImp", logistics: initial },
      });

      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(result.action).toBe(action);
      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockContractAddress,
        expect.objectContaining({ logistics: expected })
      );
    });
  });

  it("throws on duplicate logistic", async () => {
    setupDTO("addLogistic", { logistic: "0xL1" });
    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: ["0xL1"] },
    });

    await expect(ContractService.addContractLog({ contractAddress: mockContractAddress })).rejects.toThrow(
      "Logistic 0xL1 already added"
    );
  });

  it("throws on removing non-existent logistic", async () => {
    setupDTO("removeLogistic", { logistic: "0xMISSING" });
    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: ["0xL1"] },
    });

    await expect(ContractService.addContractLog({ contractAddress: mockContractAddress })).rejects.toThrow(
      "Logistic 0xMISSING not found"
    );
  });

  it("merges state and uses newState.logistics if undefined", async () => {
    (ContractLogDTO as jest.Mock).mockImplementation(() => ({
      validate: jest.fn(),
      toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: {} }),
      toState: jest.fn().mockReturnValue({ logistics: ["0xL_NEW"], exporter: "0xEXP", importer: "0xIMP" }),
      contractAddress: mockContractAddress,
      account: mockUser,
      txHash: "0xTX",
    }));

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: undefined, currentStage: "1" },
    });

    const { getContractRoles } = await import("../../utils/getContractRoles");
    (getContractRoles as jest.Mock).mockResolvedValue({ exporter: "0xEXP_FALLBACK", importer: "0xIMP_FALLBACK", logistics: [] });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("deposit");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({ logistics: [] })
    );
  });

  it("falls back logistics to empty array if both undefined", async () => {
    setupDTO("deposit");

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({
      state: { exporter: mockUser, importer: "0xImp", logistics: undefined, currentStage: undefined },
    });

    (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

    const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

    expect(result.action).toBe("deposit");
    expect(ContractModel.addContractLog).toHaveBeenCalledWith(
      expect.any(Object),
      mockContractAddress,
      expect.objectContaining({ logistics: [], currentStage: "1" })
    );
  });

  it("returns all contracts", async () => {
    (ContractModel.getAllContracts as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await ContractService.getAllContracts();
    expect(result).toHaveLength(2);
  });

  it("returns contract by id", async () => {
    (ContractModel.getContractById as jest.Mock).mockResolvedValue({ contractAddress: mockContractAddress });
    const c = await ContractService.getContractById(mockContractAddress);
    expect(c?.contractAddress).toBe(mockContractAddress);
  });

  it("assigns roles correctly with fallback", async () => {
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

  it("returns stepStatus with lastAction", async () => {
    const history = [
      { action: "deploy" },
      { action: "deposit" },
      { action: "approveImporter" },
      { action: "approveExporter" },
      { action: "finalize" },
    ];

    (ContractModel.getContractById as jest.Mock).mockResolvedValue({ history });

    const result = await ContractService.getContractStepStatus("0xAAA");

    expect(result?.stepStatus).toEqual({
      deploy: true,
      deposit: true,
      approveImporter: true,
      approveExporter: true,
      finalize: true,
    });
    expect(result?.lastAction).toEqual(history[history.length - 1]);
  });

  it("returns null if contract not found", async () => {
    (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
    const result = await ContractService.getContractStepStatus("0xAAA");
    expect(result).toBeNull();
  });
  
  describe("ContractService.addContractLog - participants notifications", () => {
    const mockContractAddress = "0xAAA";
    const mockTxHash = "0xTX";
    const mockAccount = "0xUSER";

    beforeEach(() => {
      jest.clearAllMocks();
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "testAction", extra: {} }),
        toState: jest.fn().mockReturnValue({ exporter: "0xEXP", importer: "0xIMP", logistics: ["0xLOG1"] }),
        contractAddress: mockContractAddress,
        account: mockAccount,
        action: "testAction",
        txHash: mockTxHash,
        exporter: "0xEXP",
        importer: "0xIMP",
        logistics: ["0xLOG1"],
      }));
    });

    it("should notify all participants when exporter, importer, and logistics exist", async () => {
      (ContractModel.getContractById as jest.Mock).mockResolvedValue(null);
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(notifyUsers).toHaveBeenCalledWith(
        ["0xEXP", "0xIMP", "0xLOG1"],
        expect.any(Object),
        mockAccount
      );
      expect(notifyWithAdmins).toHaveBeenCalled();
    });
  });
  
  describe("ContractService.getContractStepStatus - edge cases", () => {
    const mockContractAddress = "0xEDGE";

    it("returns lastAction null if history empty", async () => {
      (ContractModel.getContractById as jest.Mock).mockResolvedValue({ history: [] });

      const result = await ContractService.getContractStepStatus(mockContractAddress);

      expect(result?.lastAction).toBeNull();
      expect(result?.stepStatus).toEqual({
        deploy: false,
        deposit: false,
        approveImporter: false,
        approveExporter: false,
        finalize: false,
      });
    });

    it("treats undefined history as empty array", async () => {
      (ContractModel.getContractById as jest.Mock).mockResolvedValue({});

      const result = await ContractService.getContractStepStatus(mockContractAddress);

      expect(result?.lastAction).toBeNull();
      expect(result?.stepStatus).toEqual({
        deploy: false,
        deposit: false,
        approveImporter: false,
        approveExporter: false,
        finalize: false,
      });
    });
  });

  describe("ContractService.getContractsByUser - logistics role", () => {
    const mockUser = "0xLOGISTIC";

    it("assigns 'Logistics' if user in logistics array", async () => {
      (ContractModel.getContractsByUser as jest.Mock).mockResolvedValue([
        { contractAddress: "0x1", state: { exporter: "0xExp", importer: "0xImp", logistics: [mockUser] } },
      ]);

      const res = await ContractService.getContractsByUser(mockUser);
      expect(res[0].role).toBe("Logistics");
    });

    it("assigns 'Logistics' if logistics is string equal to user", async () => {
      (ContractModel.getContractsByUser as jest.Mock).mockResolvedValue([
        { contractAddress: "0x2", state: { exporter: "0xExp", importer: "0xImp", logistics: mockUser } },
      ]);

      const res = await ContractService.getContractsByUser(mockUser);
      expect(res[0].role).toBe("Logistics");
    });

    it("does not assign 'Logistics' if user not in logistics", async () => {
      (ContractModel.getContractsByUser as jest.Mock).mockResolvedValue([
        { contractAddress: "0x3", state: { exporter: "0xExp", importer: "0xImp", logistics: ["0xOther"] } },
      ]);

      const res = await ContractService.getContractsByUser(mockUser);
      expect(res).toHaveLength(0);
    });
  });
  
  describe("ContractService.addContractLog - currentStage branch", () => {
    const mockAddress = "0xSTAGE";
    const mockUser = "0xUSER";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("uses logEntry.extra.stage if it's a string", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: { stage: "5" } }),
        toState: jest.fn().mockReturnValue({ exporter: "0xEXP", importer: "0xIMP", logistics: [] }),
        contractAddress: mockAddress,
        account: mockUser,
        txHash: "0xTX",
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: "0xEXP_OLD", importer: "0xIMP_OLD", logistics: [], currentStage: "1" },
      });
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      await ContractService.addContractLog({ contractAddress: mockAddress });

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockAddress,
        expect.objectContaining({ currentStage: "5" })
      );
    });

    it("falls back to doc.state.currentStage if logEntry.extra.stage not a string", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: { stage: undefined } }),
        toState: jest.fn().mockReturnValue({ exporter: "0xEXP", importer: "0xIMP", logistics: [] }),
        contractAddress: mockAddress,
        account: mockUser,
        txHash: "0xTX",
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: "0xEXP_OLD", importer: "0xIMP_OLD", logistics: [], currentStage: "2" },
      });
      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      await ContractService.addContractLog({ contractAddress: mockAddress });

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockAddress,
        expect.objectContaining({ currentStage: "2" })
      );
    });
  });
  
  describe("ContractService.addContractLog - mergedState.logistics ??= []", () => {
    const mockContractAddress = "0xAAA";
    const mockAccount = "0xUSER";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("triggers mergedState.logistics ??= [] when doc.state.logistics is undefined and DTO returns undefined", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({
          action: "addLogistic",
          extra: { logistic: "0xL1" },
        }),
        toState: jest.fn().mockReturnValue({
          exporter: "0xEXP",
          importer: "0xIMP",
          logistics: undefined,
        }),
        contractAddress: mockContractAddress,
        account: mockAccount,
        action: "addLogistic",
        txHash: "0xTX",
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: "0xEXP", importer: "0xIMP", logistics: undefined },
      });

      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockContractAddress,
        expect.objectContaining({ logistics: ["0xL1"] })
      );

      expect(notifyUsers).toHaveBeenCalledWith(
        ["0xEXP", "0xIMP", "0xL1"],
        expect.any(Object),
        mockAccount
      );
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(result.action).toBe("addLogistic");
    });

    it("merges empty logistics correctly when removing logistic and initial undefined", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({
          action: "removeLogistic",
          extra: { logistic: "0xL1" },
        }),
        toState: jest.fn().mockReturnValue({
          exporter: "0xEXP",
          importer: "0xIMP",
          logistics: undefined,
        }),
        contractAddress: mockContractAddress,
        account: mockAccount,
        action: "removeLogistic",
        txHash: "0xTX",
      }));

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: "0xEXP", importer: "0xIMP", logistics: ["0xL1"] },
      });

      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      const result = await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockContractAddress,
        expect.objectContaining({ logistics: [] })
      );

      expect(notifyUsers).toHaveBeenCalledWith(
        ["0xEXP", "0xIMP"],
        expect.any(Object),
        mockAccount
      );
      expect(result.action).toBe("removeLogistic");
    });
  });
  
  describe("ContractService.addContractLog - exporter/importer fallback", () => {
    const mockContractAddress = "0xFFF";
    const mockUser = "0xUSER";

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("falls back to doc.state if both extra and newState missing", async () => {
      (ContractLogDTO as jest.Mock).mockImplementation(() => ({
        validate: jest.fn(),
        toLogEntry: jest.fn().mockReturnValue({ action: "deposit", extra: {} }),
        toState: jest.fn().mockReturnValue({}),
        contractAddress: mockContractAddress,
        account: mockUser,
        txHash: "0xTX",
      }));

      const getContractRoles = jest.spyOn(require("../../utils/getContractRoles"), "getContractRoles")
        .mockResolvedValue({ exporter: undefined, importer: undefined, logistics: undefined });

      (ContractModel.getContractById as jest.Mock).mockResolvedValue({
        state: { exporter: "0xE_DOC", importer: "0xI_DOC", logistics: [] },
      });

      (ContractModel.addContractLog as jest.Mock).mockResolvedValue(true);

      await ContractService.addContractLog({ contractAddress: mockContractAddress });

      expect(ContractModel.addContractLog).toHaveBeenCalledWith(
        expect.any(Object),
        mockContractAddress,
        expect.objectContaining({
          exporter: "0xE_DOC",
          importer: "0xI_DOC",
        })
      );

      getContractRoles.mockRestore();
    });
  });
});