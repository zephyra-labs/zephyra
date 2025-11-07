/**
 * @file kycDTO.test.ts
 * @description Unit tests for KYCDTO
 */

import KYCDTO from "../kycDTO";
import type { KYC, KYCStatus } from "../../types/Kyc";

describe("KYCDTO", () => {
  const baseData: Partial<KYC> = {
    tokenId: "1",
    owner: "0xabc123",
    fileHash: "hash123",
    metadataUrl: "https://example.com/metadata.json",
  };

  it("should throw if required fields are missing", () => {
    expect(() => new KYCDTO({} as any)).toThrow(/tokenId is required/);
    expect(() => new KYCDTO({ tokenId: "1" } as any)).toThrow(/owner is required/);
    expect(() =>
      new KYCDTO({ tokenId: "1", owner: "0xabc" } as any)
    ).toThrow(/fileHash is required/);
    expect(() =>
      new KYCDTO({ tokenId: "1", owner: "0xabc", fileHash: "hash123" } as any)
    ).toThrow(/metadataUrl is required/);
  });

  it("should create DTO with defaults", () => {
    const dto = new KYCDTO(baseData);
    expect(dto.tokenId).toBe(baseData.tokenId);
    expect(dto.owner).toBe(baseData.owner);
    expect(dto.fileHash).toBe(baseData.fileHash);
    expect(dto.metadataUrl).toBe(baseData.metadataUrl);
    expect(dto.name).toBe(`NFT-${baseData.tokenId}`);
    expect(dto.description).toBe("");
    expect(dto.createdAt).toBeDefined();
    expect(dto.updatedAt).toBeDefined();
    expect(dto.status).toBe("Draft");
  });

  it("should accept optional fields and provided status", () => {
    const now = Date.now();
    const dto = new KYCDTO({
      ...baseData,
      documentUrl: "https://example.com/doc.pdf",
      name: "My NFT",
      description: "Test NFT",
      txHash: "0x123",
      createdAt: now,
      updatedAt: now,
      status: "Pending" as KYCStatus,
    });

    expect(dto.documentUrl).toBe("https://example.com/doc.pdf");
    expect(dto.name).toBe("My NFT");
    expect(dto.description).toBe("Test NFT");
    expect(dto.txHash).toBe("0x123");
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
    expect(dto.status).toBe("Pending");
  });

  it("toFirestore should return proper KYC object", () => {
    const dto = new KYCDTO(baseData);
    const fsObj = dto.toFirestore();
    expect(fsObj.tokenId).toBe(dto.tokenId);
    expect(fsObj.owner).toBe(dto.owner);
    expect(fsObj.fileHash).toBe(dto.fileHash);
    expect(fsObj.metadataUrl).toBe(dto.metadataUrl);
    expect(fsObj.name).toBe(dto.name);
    expect(fsObj.description).toBe(dto.description);
    expect(fsObj.createdAt).toBe(dto.createdAt);
    expect(fsObj.updatedAt).toBe(dto.updatedAt);
    expect(fsObj.status).toBe(dto.status);
  });
});
