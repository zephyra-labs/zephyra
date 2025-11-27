/**
 * @file documentController.test.ts
 * @description Complete unit tests for documentController
 */

import { Request } from "express";
import * as documentController from "../documentController";
import { DocumentService } from "../../services/documentService";
import { success, failure, handleError } from "../../utils/responseHelper";

jest.mock("../../services/documentService");
jest.mock("../../utils/responseHelper");
jest.mock("../../dtos/documentDTO");

export function createMockResponse(): jest.Mocked<import("express").Response> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<import("express").Response>;
  return res;
}

describe("documentController", () => {
  let res: jest.Mocked<import("express").Response>;
  const mockDoc = { tokenId: 1, owner: "owner1", fileHash: "hash", uri: "uri" };
  const mockDocs = [mockDoc];

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("attachDocument", () => {
    const baseReq = {
      params: { addr: "0x123" },
      body: {
        tokenId: 1,
        owner: "owner1",
        fileHash: "hash",
        uri: "uri",
        docType: "type",
        signer: "signer",
        action: "create",
      },
    } as unknown as Request;

    it("should attach a document", async () => {
      (DocumentService.createDocument as jest.Mock).mockResolvedValue(mockDoc);
      await documentController.attachDocument(baseReq, res);
      expect(DocumentService.createDocument).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(res, mockDoc, 201);
    });

    it("should fail if any required field missing", async () => {
      const req = { params: {}, body: {} } as unknown as Request;
      await documentController.attachDocument(req, res);
      expect(failure).toHaveBeenCalledWith(res, expect.stringContaining("Missing required field"), 422);
    });

    it("should handle service errors", async () => {
      const err = new Error("fail");
      (DocumentService.createDocument as jest.Mock).mockRejectedValue(err);
      await documentController.attachDocument(baseReq, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to attach document", 500);
    });
  });

  describe("getAllDocuments", () => {
    it("should return all documents", async () => {
      (DocumentService.getAllDocuments as jest.Mock).mockResolvedValue(mockDocs);
      await documentController.getAllDocuments({} as Request, res);
      expect(DocumentService.getAllDocuments).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(res, mockDocs, 200);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (DocumentService.getAllDocuments as jest.Mock).mockRejectedValue(err);
      await documentController.getAllDocuments({} as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch documents", 500);
    });
  });

  describe("getDocument", () => {
    it("should return document by tokenId", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);
      await documentController.getDocument({ params: { tokenId: "1" } } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, mockDoc, 200);
    });

    it("should fail if tokenId missing", async () => {
      await documentController.getDocument({ params: {} } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Invalid tokenId format", 422);
    });

    it("should fail if tokenId not a number", async () => {
      await documentController.getDocument({ params: { tokenId: "abc" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Invalid tokenId format", 422);
    });

    it("should fail if document not found", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(null);
      await documentController.getDocument({ params: { tokenId: "999" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Document not found", 404);
    });

    it("should handle service errors", async () => {
      const err = new Error("fail");
      (DocumentService.getDocumentById as jest.Mock).mockRejectedValue(err);
      await documentController.getDocument({ params: { tokenId: "1" } } as unknown as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch document", 500);
    });
  });

  describe("getDocumentsByOwner", () => {
    it("should return documents by owner", async () => {
      (DocumentService.getDocumentsByOwner as jest.Mock).mockResolvedValue(mockDocs);
      await documentController.getDocumentsByOwner({ params: { owner: "owner1" } } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, mockDocs, 200);
    });

    it("should fail if owner missing", async () => {
      await documentController.getDocumentsByOwner({ params: {} } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing owner parameter", 422);
    });
  });

  describe("getDocumentsByContract", () => {
    it("should return documents by contract", async () => {
      (DocumentService.getDocumentsByContract as jest.Mock).mockResolvedValue(mockDocs);
      await documentController.getDocumentsByContract({ params: { addr: "0x123" } } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, mockDocs, 200);
    });

    it("should fail if contract address missing", async () => {
      await documentController.getDocumentsByContract({ params: {} } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing contract address", 422);
    });
  });

  describe("getDocumentLogs", () => {
    it("should return logs if exist", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue({ ...mockDoc, history: ["log1"] });
      await documentController.getDocumentLogs({ params: { tokenId: "1" } } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, ["log1"], 200);
    });

    it("should fail if no document", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(null);
      await documentController.getDocumentLogs({ params: { tokenId: "1" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Document not found", 404);
    });

    it("should fail if no logs", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue({ ...mockDoc, history: [] });
      await documentController.getDocumentLogs({ params: { tokenId: "1" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "No logs found", 404);
    });

    it("should fail if tokenId invalid", async () => {
      await documentController.getDocumentLogs({ params: { tokenId: "abc" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Invalid tokenId format", 422);
    });
  });

  describe("updateDocument", () => {
    it("should update document", async () => {
      (DocumentService.updateDocument as jest.Mock).mockResolvedValue(mockDoc);
      await documentController.updateDocument({
        params: { tokenId: "1" },
        body: { action: "upd", account: "acc", name: "newName" },
      } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, mockDoc, 200);
    });

    it("should fail if action missing", async () => {
      await documentController.updateDocument({ params: { tokenId: "1" }, body: { account: "acc" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing action field", 422);
    });

    it("should fail if account missing", async () => {
      await documentController.updateDocument({ params: { tokenId: "1" }, body: { action: "upd" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing account field", 422);
    });

    it("should fail if tokenId invalid", async () => {
      await documentController.updateDocument({ params: { tokenId: "abc" }, body: { action: "upd", account: "acc" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Invalid tokenId format", 422);
    });

    it("should fail if document not found", async () => {
      (DocumentService.updateDocument as jest.Mock).mockResolvedValue(null);
      await documentController.updateDocument({ params: { tokenId: "1" }, body: { action: "upd", account: "acc" } } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Document not found", 404);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document successfully", async () => {
      (DocumentService.deleteDocument as jest.Mock).mockResolvedValue(true);
      await documentController.deleteDocument({
        params: { tokenId: "1" },
        body: { action: "del", account: "acc" },
      } as unknown as Request, res);
      expect(success).toHaveBeenCalledWith(res, { message: "Document deleted successfully" }, 200);
    });

    it("should fail if action missing", async () => {
      await documentController.deleteDocument({
        params: { tokenId: "1" },
        body: { account: "acc" },
      } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing action field", 422);
    });

    it("should fail if account missing", async () => {
      await documentController.deleteDocument({
        params: { tokenId: "1" },
        body: { action: "del" },
      } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Missing account field", 422);
    });

    it("should fail if tokenId invalid", async () => {
      await documentController.deleteDocument({
        params: { tokenId: "abc" },
        body: { action: "del", account: "acc" },
      } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Invalid tokenId format", 422);
    });

    it("should fail if document not found", async () => {
      (DocumentService.deleteDocument as jest.Mock).mockResolvedValue(false);
      await documentController.deleteDocument({
        params: { tokenId: "999" },
        body: { action: "del", account: "acc" },
      } as unknown as Request, res);
      expect(failure).toHaveBeenCalledWith(res, "Document not found", 404);
    });

    it("should handle service errors", async () => {
      const err = new Error("fail");
      (DocumentService.deleteDocument as jest.Mock).mockRejectedValue(err);
      await documentController.deleteDocument({
        params: { tokenId: "1" },
        body: { action: "del", account: "acc" },
      } as unknown as Request, res);
      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to delete document", 500);
    });
    
    it("should handle error in getDocumentsByOwner", async () => {
      const err = new Error("fail");
      (DocumentService.getDocumentsByOwner as jest.Mock).mockRejectedValue(err);

      await documentController.getDocumentsByOwner({ params: { owner: "owner1" } } as unknown as Request, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch documents by owner", 500);
    });

    it("should handle error in getDocumentsByContract", async () => {
      const err = new Error("fail");
      (DocumentService.getDocumentsByContract as jest.Mock).mockRejectedValue(err);

      await documentController.getDocumentsByContract({ params: { addr: "0x123" } } as unknown as Request, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch documents by contract", 500);
    });

    it("should handle error in getDocumentLogs", async () => {
      const err = new Error("fail");
      (DocumentService.getDocumentById as jest.Mock).mockRejectedValue(err);

      await documentController.getDocumentLogs({ params: { tokenId: "1" } } as unknown as Request, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to fetch document logs", 500);
    });

    it("should handle error in updateDocument", async () => {
      const err = new Error("fail");
      (DocumentService.updateDocument as jest.Mock).mockRejectedValue(err);

      await documentController.updateDocument({
        params: { tokenId: "1" },
        body: { action: "upd", account: "acc" }
      } as unknown as Request, res);

      expect(handleError).toHaveBeenCalledWith(res, err, "Failed to update document", 500);
    });
    
    it("should fail if document history is undefined", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue({ ...mockDoc, history: undefined });

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocumentLogs(req, res);

      expect(failure).toHaveBeenCalledWith(res, "No logs found", 404);
    });
  });
});
