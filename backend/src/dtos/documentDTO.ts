/**
 * @file DocumentDTO.ts
 * @description Data Transfer Object for Document entity with validation and Firestore transformation.
 */

import { Document, DocType, DocumentStatus } from "../types/Document.js";

/**
 * DTO for Document
 */
export default class DocumentDTO {
  /** Unique token ID */
  tokenId: number;

  /** Owner wallet address */
  owner: string;

  /** File hash of the document */
  fileHash: string;

  /** URI or storage URL */
  uri: string;

  /** Document type */
  docType: DocType;

  /** Array of linked contract addresses */
  linkedContracts: string[];

  /** Document status */
  status: DocumentStatus;

  /** Optional signer address */
  signer?: string;

  /** Timestamp when created */
  createdAt: number;

  /** Timestamp when last updated */
  updatedAt?: number;

  /** Optional document name */
  name?: string;

  /** Optional document description */
  description?: string;

  /** Optional metadata URL */
  metadataUrl?: string;

  /**
   * Constructor for DocumentDTO
   * @param {Partial<Document>} data Partial document data
   * @throws {Error} If required fields are missing
   */
  constructor(data: Partial<Document>) {
    if (data.tokenId === undefined) throw new Error("tokenId is required");
    if (!data.owner) throw new Error("owner is required");
    if (!data.fileHash) throw new Error("fileHash is required");
    if (!data.uri) throw new Error("uri is required");
    if (!data.docType) throw new Error("docType is required");

    this.tokenId = data.tokenId;
    this.owner = data.owner;
    this.fileHash = data.fileHash;
    this.uri = data.uri;
    this.docType = data.docType;
    this.linkedContracts = data.linkedContracts || [];
    this.status = data.status || "Draft";
    this.signer = data.signer;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.name = data.name || "";
    this.description = data.description || "";
    this.metadataUrl = data.metadataUrl || "";
  }

  /**
   * Transform DTO into Document object ready for Firestore
   * @returns {Document} Document object
   */
  toFirestore(): Document {
    return {
      tokenId: this.tokenId,
      owner: this.owner,
      fileHash: this.fileHash,
      uri: this.uri,
      docType: this.docType,
      linkedContracts: this.linkedContracts,
      status: this.status,
      signer: this.signer,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      name: this.name,
      description: this.description,
      metadataUrl: this.metadataUrl,
    };
  }
}
