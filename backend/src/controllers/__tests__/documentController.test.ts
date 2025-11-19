/**
 * @file documentController.test.ts
 * @description Unit tests for documentController
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
  let mockRes: jest.Mocked<import("express").Response>;
  const mockDoc = { tokenId: 1, owner: "owner1", fileHash: "hash", uri: "uri" };
  const mockDocs = [mockDoc];

  beforeEach(() => {
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  describe("attachDocument", () => {
    it("should attach a document", async () => {
      (DocumentService.createDocument as jest.Mock).mockResolvedValue(mockDoc);

      const req = {
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

      await documentController.attachDocument(req, mockRes);

      expect(DocumentService.createDocument).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockDoc, 201);
    });

    it("should fail if required fields missing", async () => {
      const req = { params: {}, body: {} } as unknown as Request;
      await documentController.attachDocument(req, mockRes);
      expect(failure).toHaveBeenCalled();
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (DocumentService.createDocument as jest.Mock).mockRejectedValue(err);
      const req = {
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

      await documentController.attachDocument(req, mockRes);
      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to attach document", 500);
    });
  });

  describe("getAllDocuments", () => {
    it("should return all documents", async () => {
      (DocumentService.getAllDocuments as jest.Mock).mockResolvedValue(mockDocs);

      await documentController.getAllDocuments({} as Request, mockRes);

      expect(DocumentService.getAllDocuments).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockDocs, 200);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (DocumentService.getAllDocuments as jest.Mock).mockRejectedValue(err);

      await documentController.getAllDocuments({} as Request, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch documents", 500);
    });
  });

  describe("getDocument", () => {
    it("should return document by tokenId", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocument(req, mockRes);

      expect(DocumentService.getDocumentById).toHaveBeenCalledWith(1);
      expect(success).toHaveBeenCalledWith(mockRes, mockDoc, 200);
    });

    it("should return 404 if document not found", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(null);

      const req = { params: { tokenId: "999" } } as unknown as Request;

      await documentController.getDocument(req, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Document not found", 404);
    });

    it("should handle errors", async () => {
      const err = new Error("fail");
      (DocumentService.getDocumentById as jest.Mock).mockRejectedValue(err);

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocument(req, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockRes, err, "Failed to fetch document", 500);
    });
  });

  describe("getDocumentsByOwner", () => {
    it("should return documents by owner", async () => {
      (DocumentService.getDocumentsByOwner as jest.Mock).mockResolvedValue(mockDocs);

      const req = { params: { owner: "owner1" } } as unknown as Request;

      await documentController.getDocumentsByOwner(req, mockRes);

      expect(DocumentService.getDocumentsByOwner).toHaveBeenCalledWith("owner1");
      expect(success).toHaveBeenCalledWith(mockRes, mockDocs, 200);
    });
  });

  describe("getDocumentsByContract", () => {
    it("should return documents by contract", async () => {
      (DocumentService.getDocumentsByContract as jest.Mock).mockResolvedValue(mockDocs);

      const req = { params: { addr: "0x123" } } as unknown as Request;

      await documentController.getDocumentsByContract(req, mockRes);

      expect(DocumentService.getDocumentsByContract).toHaveBeenCalledWith("0x123");
      expect(success).toHaveBeenCalledWith(mockRes, mockDocs, 200);
    });
  });

  describe("getDocumentLogs", () => {
    it("should return logs if exist", async () => {
      const docWithLogs = { ...mockDoc, history: ["log1"] };
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(docWithLogs);

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocumentLogs(req, mockRes);

      expect(success).toHaveBeenCalledWith(mockRes, ["log1"], 200);
    });

    it("should return 404 if no document", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(null);

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocumentLogs(req, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Document not found", 404);
    });

    it("should return 404 if no logs", async () => {
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue({ ...mockDoc, history: [] });

      const req = { params: { tokenId: "1" } } as unknown as Request;

      await documentController.getDocumentLogs(req, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "No logs found", 404);
    });
  });

  describe("updateDocument", () => {
    it("should update a document", async () => {
      (DocumentService.updateDocument as jest.Mock).mockResolvedValue(mockDoc);

      const req = {
        params: { tokenId: "1" },
        body: { action: "update", account: "acc", name: "newName" },
      } as unknown as Request;

      await documentController.updateDocument(req, mockRes);

      expect(DocumentService.updateDocument).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockDoc, 200);
    });

    it("should fail if action/account missing", async () => {
      await documentController.updateDocument({ params: {}, body: {} } as unknown as Request, mockRes);
      expect(failure).toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("should delete document", async () => {
      (DocumentService.deleteDocument as jest.Mock).mockResolvedValue(true);

      const req = {
        params: { tokenId: "1" },
        body: { action: "del", account: "acc" },
      } as unknown as Request;

      await documentController.deleteDocument(req, mockRes);

      expect(DocumentService.deleteDocument).toHaveBeenCalledWith(1, "acc", "del", undefined);
      expect(success).toHaveBeenCalledWith(mockRes, { message: "Document deleted successfully" }, 200);
    });

    it("should return 404 if document not found", async () => {
      (DocumentService.deleteDocument as jest.Mock).mockResolvedValue(false);

      const req = {
        params: { tokenId: "999" },
        body: { action: "del", account: "acc" },
      } as unknown as Request;

      await documentController.deleteDocument(req, mockRes);

      expect(failure).toHaveBeenCalledWith(mockRes, "Document not found", 404);
    });
  });
});
