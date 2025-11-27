/**
 * @file documentDTO.test.ts
 * @description Unit tests for DocumentDTO
 */

import DocumentDTO from "../documentDTO";
import type { Document, DocType, DocumentStatus } from "../../types/Document";

describe("DocumentDTO", () => {
  const baseData: Partial<Document> = {
    tokenId: 1,
    owner: "0xabc123",
    fileHash: "hash123",
    uri: "https://example.com/doc.pdf",
    docType: "Legal" as DocType,
  };

  it("should throw if required fields are missing", () => {
    expect(() => new DocumentDTO({} as any)).toThrow(/tokenId is required/);
    expect(() => new DocumentDTO({ tokenId: 1 } as any)).toThrow(/owner is required/);
    expect(() =>
      new DocumentDTO({ tokenId: 1, owner: "0xabc" } as any)
    ).toThrow(/fileHash is required/);
    expect(() =>
      new DocumentDTO({ tokenId: 1, owner: "0xabc", fileHash: "hash123" } as any)
    ).toThrow(/uri is required/);
    expect(() =>
      new DocumentDTO({ tokenId: 1, owner: "0xabc", fileHash: "hash123", uri: "url" } as any)
    ).toThrow(/docType is required/);
  });

  it("should create DTO with defaults", () => {
    const dto = new DocumentDTO(baseData);
    expect(dto.tokenId).toBe(baseData.tokenId);
    expect(dto.owner).toBe(baseData.owner);
    expect(dto.fileHash).toBe(baseData.fileHash);
    expect(dto.uri).toBe(baseData.uri);
    expect(dto.docType).toBe(baseData.docType);
    expect(dto.linkedContracts).toEqual([]);
    expect(dto.status).toBe("Draft");
    expect(dto.name).toBe("");
    expect(dto.description).toBe("");
    expect(dto.metadataUrl).toBe("");
    expect(dto.createdAt).toBeDefined();
    expect(dto.updatedAt).toBeDefined();
  });

  it("should accept optional fields", () => {
    const now = Date.now();
    const dto = new DocumentDTO({
      ...baseData,
      linkedContracts: ["0x123", "0x456"],
      status: "Approved" as DocumentStatus,
      signer: "0xsigner",
      createdAt: now,
      updatedAt: now,
      name: "Doc Name",
      description: "Doc Description",
      metadataUrl: "https://example.com/meta.json",
    });

    expect(dto.linkedContracts).toEqual(["0x123", "0x456"]);
    expect(dto.status).toBe("Approved");
    expect(dto.signer).toBe("0xsigner");
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
    expect(dto.name).toBe("Doc Name");
    expect(dto.description).toBe("Doc Description");
    expect(dto.metadataUrl).toBe("https://example.com/meta.json");
  });

  it("toFirestore should return proper Document object", () => {
    const dto = new DocumentDTO(baseData);
    const fsObj = dto.toFirestore();
    expect(fsObj.tokenId).toBe(dto.tokenId);
    expect(fsObj.owner).toBe(dto.owner);
    expect(fsObj.fileHash).toBe(dto.fileHash);
    expect(fsObj.uri).toBe(dto.uri);
    expect(fsObj.docType).toBe(dto.docType);
    expect(fsObj.linkedContracts).toEqual(dto.linkedContracts);
    expect(fsObj.status).toBe(dto.status);
    expect(fsObj.name).toBe(dto.name);
    expect(fsObj.description).toBe(dto.description);
    expect(fsObj.metadataUrl).toBe(dto.metadataUrl);
  });
});
