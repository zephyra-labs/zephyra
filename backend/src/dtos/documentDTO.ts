import { Document, DocType, DocumentStatus } from "../types/Document.js"

export default class DocumentDTO {
  tokenId: number
  owner: string
  fileHash: string
  uri: string
  docType: DocType
  linkedContracts: string[]
  status: DocumentStatus
  createdAt: number
  updatedAt?: number
  signer?: string
  name?: string
  description?: string
  metadataUrl?: string

  constructor(data: Partial<Document>) {
    if (data.tokenId === undefined) throw new Error("tokenId is required")
    if (!data.owner) throw new Error("owner is required")
    if (!data.fileHash) throw new Error("fileHash is required")
    if (!data.uri) throw new Error("uri is required")
    if (!data.docType) throw new Error("docType is required")

    this.tokenId = data.tokenId
    this.owner = data.owner
    this.fileHash = data.fileHash
    this.uri = data.uri
    this.docType = data.docType
    this.linkedContracts = data.linkedContracts || []
    this.status = data.status || "Draft"
    this.signer = data.signer
    this.createdAt = data.createdAt || Date.now()
    this.updatedAt = data.updatedAt || Date.now()
    this.name = data.name || ""
    this.description = data.description || ""
    this.metadataUrl = data.metadataUrl || ""
  }

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
    }
  }
}
