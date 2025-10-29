import { Request, Response } from "express"
import DocumentDTO from "../dtos/documentDTO.js"
import { DocumentService } from "../services/documentService.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

// --- POST /contract/:addr/docs ---
export const attachDocument = async (req: Request, res: Response) => {
  try {
    const { addr: contractAddress } = req.params
    const {
      tokenId,
      owner,
      fileHash,
      uri,
      docType,
      signer,
      name,
      description,
      metadataUrl,
      action,
      txHash,
    } = req.body

    if (!tokenId || !owner || !fileHash || !uri || !docType)
      return failure(res, "Missing required fields")
    if (!action) return failure(res, "Missing action field")
    if (!signer) return failure(res, "Missing signer/account field")

    const dto = new DocumentDTO({
      tokenId,
      owner,
      fileHash,
      uri,
      docType,
      linkedContracts: [contractAddress],
      signer,
      name,
      description,
      metadataUrl,
      status: "Draft",
      createdAt: Date.now(),
    })

    const document = await DocumentService.createDocument(dto.toFirestore(), signer, action, txHash)
    return success(res, document, 201)
  } catch (err) {
    return handleError(res, err, "Failed to attach document")
  }
}

// --- GET /documents ---
export const getAllDocuments = async (_req: Request, res: Response) => {
  try {
    const docs = await DocumentService.getAllDocuments()
    return success(res, docs)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents")
  }
}

// --- GET /documents/:tokenId ---
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const doc = await DocumentService.getDocumentById(+tokenId)
    if (!doc) return failure(res, "Document not found", 404)
    return success(res, doc)
  } catch (err) {
    return handleError(res, err, "Failed to fetch document")
  }
}

// --- GET /documents/owner/:owner ---
export const getDocumentsByOwner = async (req: Request, res: Response) => {
  try {
    const { owner } = req.params
    const docs = await DocumentService.getDocumentsByOwner(owner)
    return success(res, docs)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents by owner")
  }
}

// --- GET /documents/contract/:addr ---
export const getDocumentsByContract = async (req: Request, res: Response) => {
  try {
    const { addr } = req.params
    const docs = await DocumentService.getDocumentsByContract(addr)
    return success(res, docs)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents by contract")
  }
}

// --- GET /documents/:tokenId/logs ---
export const getDocumentLogs = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const doc = await DocumentService.getDocumentById(+tokenId)
    if (!doc) return failure(res, "Document not found", 404)

    const logs = doc.history || []
    if (!logs.length) return failure(res, "No logs found", 404)
    return success(res, logs)
  } catch (err) {
    return handleError(res, err, "Failed to fetch document logs")
  }
}

// --- PATCH /documents/:tokenId ---
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account, ...updateData } = req.body

    if (!action) return failure(res, "Missing action field")
    if (!account) return failure(res, "Missing account field")

    const updated = await DocumentService.updateDocument(+tokenId, updateData, account, action, txHash)
    return success(res, updated)
  } catch (err) {
    return handleError(res, err, "Failed to update document")
  }
}

// --- DELETE /documents/:tokenId ---
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account } = req.body

    if (!action) return failure(res, "Missing action field")
    if (!account) return failure(res, "Missing account field")

    const deleted = await DocumentService.deleteDocument(+tokenId, account, action, txHash)
    if (!deleted) return failure(res, "Document not found", 404)
    return success(res, { message: "Document deleted successfully" })
  } catch (err) {
    return handleError(res, err, "Failed to delete document")
  }
}
