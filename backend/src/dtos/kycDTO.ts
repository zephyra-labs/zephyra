import { KYC, KYCStatus } from "../types/Kyc.js"

export default class KYCDTO {
  tokenId: string
  owner: string
  fileHash: string
  metadataUrl: string
  documentUrl?: string
  name?: string
  description?: string
  txHash?: string
  createdAt: number
  updatedAt?: number
  status: KYCStatus

  constructor(data: Partial<KYC> & { status?: KYCStatus }) {
    if (!data.tokenId) throw new Error("tokenId is required")
    if (!data.owner) throw new Error("owner is required")
    if (!data.fileHash) throw new Error("fileHash is required")
    if (!data.metadataUrl) throw new Error("metadataUrl is required")

    this.tokenId = data.tokenId
    this.owner = data.owner
    this.fileHash = data.fileHash
    this.metadataUrl = data.metadataUrl
    this.documentUrl = data.documentUrl
    this.name = data.name || `NFT-${data.tokenId}`
    this.description = data.description || ""
    this.txHash = data.txHash
    this.createdAt = data.createdAt || Date.now()
    this.updatedAt = data.updatedAt || Date.now()
    this.status = data.status || "Draft"
  }

  toFirestore(): KYC {
    return {
      tokenId: this.tokenId,
      owner: this.owner,
      fileHash: this.fileHash,
      metadataUrl: this.metadataUrl,
      documentUrl: this.documentUrl,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
    }
  }
}
