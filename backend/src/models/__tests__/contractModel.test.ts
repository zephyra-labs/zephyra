/**
 * @file contractModel.test.ts
 * @description Unit tests for ContractModel with full coverage
 */

import { ContractModel } from "../contractModel";
import type { ContractLogs, ContractLogEntry, ContractState } from "../../types/Contract";

jest.mock("firebase-admin", () => ({
  firestore: {
    FieldValue: {
      arrayUnion: (item: any) => [item],
    },
  },
}));

jest.mock("@/utils/getContractRoles", () => ({
  getContractRoles: jest.fn().mockResolvedValue({
    exporter: "0xuser1",
    importer: "0xuser2",
    logistics: ["0xuser3"],
  }),
}));

jest.mock("../../config/firebase", () => {
  const __collections: Record<string, Record<string, ContractLogs>> = {};

  const mockDoc = (collectionName: string, docId: string) => ({
    set: jest.fn(async (data: ContractLogs) => {
      if (!__collections[collectionName]) __collections[collectionName] = {};
      __collections[collectionName][docId] = {
        contractAddress: docId,
        history: Array.isArray(data.history) ? data.history : [],
        state: data.state ?? {},
      };
    }),
    get: jest.fn(async () => ({
      exists: !!(__collections[collectionName]?.[docId]),
      data: () => __collections[collectionName]?.[docId],
    })),
    update: jest.fn(async (data: Partial<ContractLogs>) => {
      const old = __collections[collectionName]?.[docId];
      if (!old) throw new Error("Contract does not exist");

      const newHistory = Array.isArray(data.history) ? [...old.history, ...data.history] : old.history;

      __collections[collectionName][docId] = {
        ...old,
        ...data,
        history: newHistory,
        state: { ...old.state, ...(data.state ?? {}) },
      };
    }),
  });

  const mockCollection = (name: string) => ({
    doc: (id: string) => mockDoc(name, id),
    get: jest.fn(async () => ({
      docs: Object.entries(__collections[name] || {}).map(([id, data]) => ({ id, data: () => data })),
    })),
    __reset: () => { __collections[name] = {}; },
  });

  return { db: { collection: (name: string) => mockCollection(name), __collections } };
});

describe("ContractModel Full Coverage", () => {
  const collectionName = "contractLogs";
  const contractAddress = "0xabc123";

  const logDeposit: ContractLogEntry = {
    action: "deposit",
    txHash: "0xhash1",
    account: "0xacc1",
    timestamp: Date.now(),
  };

  const logDeploy: ContractLogEntry = {
    action: "deploy",
    txHash: "0xhash2",
    account: "0xacc2",
    timestamp: Date.now(),
  };

  const logApproveImporter: ContractLogEntry = {
    action: "approveImporter",
    txHash: "0xhash3",
    account: "0xacc3",
    timestamp: Date.now(),
  };

  const logApproveExporter: ContractLogEntry = {
    action: "approveExporter",
    txHash: "0xhash4",
    account: "0xacc4",
    timestamp: Date.now(),
  };

  const logFinalize: ContractLogEntry = {
    action: "finalize",
    txHash: "0xhash5",
    account: "0xacc5",
    timestamp: Date.now(),
  };

  const initialState: ContractState = {
    status: "deposit",
    currentStage: "1",
    lastUpdated: Date.now(),
  };

  const newState: ContractState = {
    status: "deploy",
    currentStage: "2",
    lastUpdated: Date.now(),
  };

  beforeEach(() => {
    const { db } = jest.requireMock("../../config/firebase");
    db.__collections[collectionName] = {};
  });

  it("should create a new contract log if contract does not exist (without newState)", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress);
    const { db } = jest.requireMock("../../config/firebase");
    const stored = db.__collections[collectionName][contractAddress];

    expect(stored).toBeDefined();
    expect(stored.history.length).toBe(1);
    expect(stored.history[0]).toEqual(logDeposit);
    expect(stored.state.currentStage).toBe("1");
    expect(stored.state.status).toBe("deposit");
  });

  it("should create a new contract log with newState", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, initialState);
    const { db } = jest.requireMock("../../config/firebase");
    const stored = db.__collections[collectionName][contractAddress];

    expect(stored).toBeDefined();
    expect(stored.history.length).toBe(1);
    expect(stored.state.status).toBe("deposit");
  });

  it("should update existing contract log and merge state", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, initialState);
    await ContractModel.addContractLog(logDeploy, contractAddress, newState);

    const { db } = jest.requireMock("../../config/firebase");
    const stored = db.__collections[collectionName][contractAddress];

    expect(stored).toBeDefined();
    expect(stored.history.length).toBe(2);
    expect(stored.history[1]).toEqual(logDeploy);
    expect(stored.state.status).toBe("deploy");
    expect(stored.state.currentStage).toBe("2");
  });

  it("should get all contracts", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, initialState);
    const all = await ContractModel.getAllContracts();
    expect(all.length).toBe(1);
    expect(all[0].contractAddress).toBe(contractAddress);
  });

  it("should get contract by id or return null", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, initialState);
    const found = await ContractModel.getContractById(contractAddress);
    expect(found?.contractAddress).toBe(contractAddress);

    const notFound = await ContractModel.getContractById("0xnone");
    expect(notFound).toBeNull();
  });

  it("should update contract state without adding log", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, initialState);
    const updatedState: ContractState = { status: "deploy", currentStage: "2", lastUpdated: Date.now() };
    await ContractModel.updateContractState(contractAddress, updatedState);

    const { db } = jest.requireMock("../../config/firebase");
    const stored = db.__collections[collectionName][contractAddress];

    expect(stored).toBeDefined();
    expect(stored.history.length).toBe(1);
    expect(stored.state.status).toBe("deploy");
  });

  it("should throw error if updating state of non-existing contract", async () => {
    await expect(ContractModel.updateContractState("0xnone", newState)).rejects.toThrow("Contract does not exist");
  });

  it("should return contract step status correctly (all steps)", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress);
    await ContractModel.addContractLog(logDeploy, contractAddress);
    await ContractModel.addContractLog(logApproveImporter, contractAddress);
    await ContractModel.addContractLog(logApproveExporter, contractAddress);
    await ContractModel.addContractLog(logFinalize, contractAddress);

    const status = await ContractModel.getContractStepStatus(contractAddress);
    expect(status).toBeDefined();
    expect(status?.stepStatus.deposit).toBe(true);
    expect(status?.stepStatus.deploy).toBe(true);
    expect(status?.stepStatus.approveImporter).toBe(true);
    expect(status?.stepStatus.approveExporter).toBe(true);
    expect(status?.stepStatus.finalize).toBe(true);
    expect(status?.lastAction?.action).toBe("finalize");
  });

  it("should return null for step status if contract does not exist", async () => {
    const status = await ContractModel.getContractStepStatus("0xnone");
    expect(status).toBeNull();
  });

  it("should get contracts by user with roles", async () => {
    await ContractModel.addContractLog(logDeposit, contractAddress, {} as any);

    const exporter = await ContractModel.getContractsByUser("0xuser1");
    const importer = await ContractModel.getContractsByUser("0xuser2");
    const logistics = await ContractModel.getContractsByUser("0xuser3");

    expect(exporter[0].role).toBe("Exporter");
    expect(importer[0].role).toBe("Importer");
    expect(logistics[0].role).toBe("Logistics");
  });

  it("should return null lastAction if history is empty", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    db.__collections[collectionName][contractAddress] = { contractAddress, history: [], state: {} };

    const status = await ContractModel.getContractStepStatus(contractAddress);
    expect(status?.lastAction).toBeNull();
  });

  it("should update state correctly even if state was initially undefined", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    db.__collections[collectionName][contractAddress] = { contractAddress, history: [] };

    const updatedState = { status: "deploy", currentStage: "2" };
    const merged = await ContractModel.updateContractState(contractAddress, updatedState);

    expect(merged.status).toBe("deploy");
    expect(merged.currentStage).toBe("2");
    expect(db.__collections[collectionName][contractAddress].state).toEqual(expect.objectContaining(updatedState));
  });

  it("should default history to empty array if undefined in getContractStepStatus", async () => {
    const { db } = jest.requireMock("../../config/firebase");
    db.__collections[collectionName][contractAddress] = { contractAddress, history: undefined, state: {} };

    const status = await ContractModel.getContractStepStatus(contractAddress);

    expect(status).toBeDefined();
    expect(status?.lastAction).toBeNull();
    expect(status?.stepStatus.deposit).toBe(false);
  });

  it("should include contract only if user has a role (covers if(role))", async () => {
    const { db } = jest.requireMock("../../config/firebase");

    const contractWithRole = "0xrole123";
    db.__collections[collectionName][contractWithRole] = {
      contractAddress: contractWithRole,
      history: [],
      state: {},
    };

    const contractNoRole = "0xnorole123";
    db.__collections[collectionName][contractNoRole] = {
      contractAddress: contractNoRole,
      history: [],
      state: {},
    };

    const { getContractRoles } = jest.requireMock("@/utils/getContractRoles");
    (getContractRoles as jest.Mock)
      .mockImplementationOnce(async () => ({
        exporter: "0xuserWithRole",
        importer: "0xother",
        logistics: ["0xanother"],
      }))
      .mockImplementationOnce(async () => ({
        exporter: "0xsomeoneElse",
        importer: "0xother",
        logistics: ["0xanother"],
      }));

    const contractsWithRole = await ContractModel.getContractsByUser("0xuserWithRole");
    expect(contractsWithRole.length).toBe(1);
    expect(contractsWithRole[0].contractAddress).toBe(contractWithRole);
    expect(["Exporter", "Importer", "Logistics"]).toContain(contractsWithRole[0].role);

    const contractsNoRole = await ContractModel.getContractsByUser("0xnoRoleUser");
    expect(contractsNoRole.length).toBe(0);
  });
});
