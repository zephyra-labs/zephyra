/**
 * @file contractController.test.ts
 * @description Full coverage test for ContractController
 */

import { ContractController } from "../contractController";
import { verifyTransaction } from "../contractController";
import { ContractService } from "../../services/contractService";
import ContractLogDTO from "../../dtos/contractDTO";
import type { AuthRequest } from "../../middlewares/authMiddleware";
import type { Request, Response } from "express";

// ------------------------------------------------------
// SHARED MOCK CLIENT FOR viem → ensures verifyOnChain works
// ------------------------------------------------------
jest.mock("viem", () => {
  const mockClient = {
    getTransactionReceipt: jest.fn(),
    getBlockNumber: jest.fn(),
  };

  return {
    createPublicClient: () => mockClient,
    http: jest.fn(),
    mockClient, // expose for tests (not a real TS export)
  };
});

// Safely extract after mock is registered
const { mockClient } = require("viem");

// ------------------------------------------------------
// Mock ContractService
// ------------------------------------------------------
jest.mock("../../services/contractService");

// ------------------------------------------------------
// Mock Response helper
// ------------------------------------------------------
function mockRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
}

// ------------------------------------------------------
// Test Suite
// ------------------------------------------------------
describe("ContractController – Full Coverage", () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
  });

  // ------------------------------------------------------
  // fetchDeployedContracts
  // ------------------------------------------------------
  describe("fetchDeployedContracts", () => {
    it("returns all contracts", async () => {
      (ContractService.getAllContracts as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await ContractController.fetchDeployedContracts({} as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [{ id: 1 }] })
      );
    });

    it("handles service error", async () => {
      (ContractService.getAllContracts as jest.Mock).mockRejectedValue(
        new Error("ERR")
      );

      await ContractController.fetchDeployedContracts({} as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // ------------------------------------------------------
  // logContractAction
  // ------------------------------------------------------
  describe("logContractAction", () => {
    const baseBody = {
      contractAddress: "0x111",
      action: "deploy",
      txHash: "0xAAA",
      account: "0xUSER",
    };

    it("rejects missing fields", async () => {
      await ContractController.logContractAction({ body: {} } as Request, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("logs contract without verifyOnChain", async () => {
      (ContractService.addContractLog as jest.Mock).mockResolvedValue({ ok: true });

      await ContractController.logContractAction({ body: baseBody } as Request, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("verifyOnChain — success branch", async () => {
      mockClient.getTransactionReceipt.mockResolvedValue({
        status: 1,
        blockNumber: 10n,
      });
      mockClient.getBlockNumber.mockResolvedValue(20n);

      (ContractService.addContractLog as jest.Mock).mockResolvedValue({ ok: true });

      await ContractController.logContractAction(
        { body: { ...baseBody, verifyOnChain: true } } as Request,
        res
      );

      expect(mockClient.getTransactionReceipt).toHaveBeenCalled();
      expect(mockClient.getBlockNumber).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("verifyOnChain — catch branch", async () => {
      mockClient.getTransactionReceipt.mockRejectedValue(new Error("TX_FAIL"));
      (ContractService.addContractLog as jest.Mock).mockResolvedValue({ ok: true });

      await ContractController.logContractAction(
        { body: { ...baseBody, verifyOnChain: true } } as Request,
        res
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("handles extra fields", async () => {
      (ContractService.addContractLog as jest.Mock).mockResolvedValue({ ok: true });

      const body = {
        ...baseBody,
        extra: {
          addLogistics: ["0xL1"],
          removeLogistics: ["0xL2"],
        },
      };

      await ContractController.logContractAction({ body } as Request, res);

      expect(ContractService.addContractLog).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: {
            addLogistics: ["0xL1"],
            removeLogistics: ["0xL2"],
          },
        })
      );
    });

    it("handles DTO.validate throwing error", async () => {
      jest.spyOn(ContractLogDTO.prototype, "validate").mockImplementation(() => {
        throw new Error("validate error");
      });

      await ContractController.logContractAction({ body: baseBody } as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("handles addContractLog error", async () => {
      (ContractService.addContractLog as jest.Mock).mockRejectedValue(
        new Error("FAIL")
      );

      await ContractController.logContractAction({ body: baseBody } as Request, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // ------------------------------------------------------
  // getContractDetails
  // ------------------------------------------------------
  describe("getContractDetails", () => {
    it("returns 400 when missing address", async () => {
      await ContractController.getContractDetails(
        { params: {} } as Request,
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns contract details", async () => {
      (ContractService.getContractById as jest.Mock).mockResolvedValue({ id: 1 });

      await ContractController.getContractDetails(
        { params: { address: "0xABC" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: 1 } })
      );
    });

    it("returns 404 when contract not found", async () => {
      (ContractService.getContractById as jest.Mock).mockResolvedValue(null);

      await ContractController.getContractDetails(
        { params: { address: "0xABC" } } as unknown as Request,
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("handles error", async () => {
      (ContractService.getContractById as jest.Mock).mockRejectedValue(
        new Error("ERR")
      );

      await ContractController.getContractDetails(
        { params: { address: "0xABC" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // ------------------------------------------------------
  // getContractStep
  // ------------------------------------------------------
  describe("getContractStep", () => {
    it("returns 400 when missing address", async () => {
      await ContractController.getContractStep({ params: {} } as Request, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns step data", async () => {
      (ContractService.getContractStepStatus as jest.Mock).mockResolvedValue({
        step: "ok",
      });

      await ContractController.getContractStep(
        { params: { address: "0x01" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { step: "ok" } })
      );
    });

    it("returns 404 when null", async () => {
      (ContractService.getContractStepStatus as jest.Mock).mockResolvedValue(null);

      await ContractController.getContractStep(
        { params: { address: "0x01" } } as unknown as Request,
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("handles error", async () => {
      (ContractService.getContractStepStatus as jest.Mock).mockRejectedValue(
        new Error("ERR")
      );

      await ContractController.getContractStep(
        { params: { address: "0x01" } } as unknown as Request,
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // ------------------------------------------------------
  // getUserContracts
  // ------------------------------------------------------
  describe("getUserContracts", () => {
    it("returns 401 when user missing", async () => {
      await ContractController.getUserContracts({} as AuthRequest, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns user contracts", async () => {
      (ContractService.getContractsByUser as jest.Mock).mockResolvedValue([
        { x: 1 },
      ]);

      const req = { user: { address: "0xUser" } } as AuthRequest;

      await ContractController.getUserContracts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [{ x: 1 }] })
      );
    });

    it("handles error", async () => {
      (ContractService.getContractsByUser as jest.Mock).mockRejectedValue(
        new Error("ERR")
      );

      const req = { user: { address: "0xUser" } } as AuthRequest;

      await ContractController.getUserContracts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
  
  // ------------------------------------------------------
  // verifyOnChain logic
  // ------------------------------------------------------
  describe("verifyTransaction", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns undefined if receipt is null", async () => {
      mockClient.getTransactionReceipt.mockResolvedValue(null);

      const result = await verifyTransaction("0xTX");
      expect(result).toBeUndefined();
      expect(mockClient.getTransactionReceipt).toHaveBeenCalledWith({
        hash: "0xTX",
      });
    });

    it("returns undefined if receipt.blockNumber is undefined", async () => {
      mockClient.getTransactionReceipt.mockResolvedValue({ status: 1 });

      const result = await verifyTransaction("0xTX");
      expect(result).toBeUndefined();
    });

    it("returns success when receipt.status is truthy", async () => {
      mockClient.getTransactionReceipt.mockResolvedValue({ status: 1, blockNumber: 100n });
      mockClient.getBlockNumber.mockResolvedValue(105n);

      const result = await verifyTransaction("0xTX");
      expect(result).toEqual({
        status: "success",
        blockNumber: 100,
        confirmations: 6, // 105 - 100 + 1
      });
    });

    it("returns failed when receipt.status is falsy", async () => {
      mockClient.getTransactionReceipt.mockResolvedValue({ status: 0, blockNumber: 50n });
      mockClient.getBlockNumber.mockResolvedValue(55n);

      const result = await verifyTransaction("0xTX");
      expect(result).toEqual({
        status: "failed",
        blockNumber: 50,
        confirmations: 6,
      });
    });

    it("returns undefined if getTransactionReceipt throws", async () => {
      mockClient.getTransactionReceipt.mockRejectedValue(new Error("TX_FAIL"));

      const result = await verifyTransaction("0xTX");
      expect(result).toBeUndefined();
    });
  });
});
