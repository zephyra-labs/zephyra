/**
 * @file KYCDTO.ts
 * @description Data Transfer Object for KYC entity with validation and transformation for storage.
 */

import { KYC, KYCStatus } from "../types/Kyc.js";

/**
 * DTO for KYC
 */
export default class KYCDTO {
  /** Unique token ID */
  tokenId: string;

  /** Owner wallet address */
  owner: string;

  /** File hash of the KYC document */
  fileHash: string;

  /** Metadata URL */
  metadataUrl: string;

  /** Optional document URL */
  documentUrl?: string;

  /** Optional name, default NFT-{tokenId} */
  name?: string;

  /** Optional description */
  description?: string;

  /** Optional transaction hash */
  txHash?: string;

  /** Timestamp when KYC was created */
  createdAt: number;

  /** Timestamp when KYC was last updated */
  updatedAt?: number;

  /** KYC status */
  status: KYCStatus;

  /**
   * Constructor for KYCDTO
   * @param {Partial<KYC> & { status?: KYCStatus }} data Partial KYC data
   * @throws {Error} If required fields are missing
   */
  constructor(data: Partial<KYC> & { status?: KYCStatus }) {
    if (!data.tokenId) throw new Error("tokenId is required");
    if (!data.owner) throw new Error("owner is required");
    if (!data.fileHash) throw new Error("fileHash is required");
    if (!data.metadataUrl) throw new Error("metadataUrl is required");

    this.tokenId = data.tokenId;
    this.owner = data.owner;
    this.fileHash = data.fileHash;
    this.metadataUrl = data.metadataUrl;
    this.documentUrl = data.documentUrl;
    this.name = data.name || `NFT-${data.tokenId}`;
    this.description = data.description || "";
    this.txHash = data.txHash;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.status = data.status || "Draft";
  }

  /**
   * Transform DTO into KYC object ready for storage
   * @returns {KYC} KYC object
   */
  toFirestore(): KYC {
    return {
      tokenId: this.tokenId,
      owner: this.owner,
      fileHash: this.fileHash,
      metadataUrl: this.metadataUrl,
      documentUrl: this.documentUrl,
      name: this.name,
      description: this.description,
      txHash: this.txHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
    };
  }
}
