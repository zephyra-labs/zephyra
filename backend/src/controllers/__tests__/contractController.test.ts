/**
 * @file contractController.test.ts
 * @description Unit tests for ContractController
 */

import { ContractController } from "../contractController";
import { ContractService } from "../../services/contractService";
import type { AuthRequest } from "../../middlewares/authMiddleware";
import type { Response, Request } from "express";

// --- Helper: Mock Response Type-safe ---
function createMockResponse(): jest.Mocked<Response> {
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

// --- Mock ContractService ---
jest.mock("../../services/contractService");

describe("ContractController", () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  // --- fetchDeployedContracts ---
  describe("fetchDeployedContracts", () => {
    it("should return all contracts", async () => {
      const contracts = [{ address: "0x123" }];
      (ContractService.getAllContracts as jest.Mock).mockResolvedValue(contracts);

      await ContractController.fetchDeployedContracts({} as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: contracts }));
    });

    it("should handle errors", async () => {
      (ContractService.getAllContracts as jest.Mock).mockRejectedValue(new Error("fail"));
      await ContractController.fetchDeployedContracts({} as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- logContractAction ---
  describe("logContractAction", () => {
    const reqBody = {
      contractAddress: "0xabc",
      action: "deploy",
      txHash: "0xhash",
      account: "0xacc",
    };

    it("should log a contract action", async () => {
      const savedLog = { id: 1, ...reqBody };
      (ContractService.addContractLog as jest.Mock).mockResolvedValue(savedLog);

      await ContractController.logContractAction({ body: reqBody } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: savedLog }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should fail if missing required fields", async () => {
      await ContractController.logContractAction({ body: {} } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should handle service errors", async () => {
      (ContractService.addContractLog as jest.Mock).mockRejectedValue(new Error("fail"));
      await ContractController.logContractAction({ body: reqBody } as unknown as Request, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getContractDetails ---
  describe("getContractDetails", () => {
    it("should return contract details", async () => {
      const contract = { address: "0xabc" };
      (ContractService.getContractById as jest.Mock).mockResolvedValue(contract);

      await ContractController.getContractDetails(
        { params: { address: "0xabc" } } as unknown as Request,
        res
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: contract }));
    });

    it("should return 404 if not found", async () => {
      (ContractService.getContractById as jest.Mock).mockResolvedValue(null);

      await ContractController.getContractDetails(
        { params: { address: "0xabc" } } as unknown as Request,
        res
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --- getContractStep ---
  describe("getContractStep", () => {
    it("should return contract step", async () => {
      const step = { stage: "deploy" };
      (ContractService.getContractStepStatus as jest.Mock).mockResolvedValue(step);

      await ContractController.getContractStep(
        { params: { address: "0xabc" } } as unknown as Request,
        res
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: step }));
    });

    it("should return 404 if contract not found", async () => {
      (ContractService.getContractStepStatus as jest.Mock).mockResolvedValue(null);

      await ContractController.getContractStep(
        { params: { address: "0xabc" } } as unknown as Request,
        res
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle service errors", async () => {
      (ContractService.getContractStepStatus as jest.Mock).mockRejectedValue(new Error("fail"));

      await ContractController.getContractStep(
        { params: { address: "0xabc" } } as unknown as Request,
        res
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // --- getUserContracts ---
  describe("getUserContracts", () => {
    it("should return user's contracts", async () => {
      const userContracts = [{ address: "0xabc" }];
      (ContractService.getContractsByUser as jest.Mock).mockResolvedValue(userContracts);

      const req = { user: { address: "0xuser" } } as AuthRequest;
      await ContractController.getUserContracts(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: userContracts }));
    });

    it("should return 401 if no user", async () => {
      const req = {} as AuthRequest;
      await ContractController.getUserContracts(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should handle service errors", async () => {
      (ContractService.getContractsByUser as jest.Mock).mockRejectedValue(new Error("fail"));

      const req = { user: { address: "0xuser" } } as AuthRequest;
      await ContractController.getUserContracts(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
