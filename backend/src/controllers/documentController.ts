/**
 * @file documentController.ts
 * @description Express controller for managing documents attached to contracts.
 * Supports creation, retrieval, update, deletion, and fetching document logs.
 */

import { Request, Response } from "express"
import DocumentDTO from "../dtos/documentDTO"
import { DocumentService } from "../services/documentService"
import { success, failure, handleError } from "../utils/responseHelper"

/**
 * Attach a new document to a contract.
 *
 * @route POST /contract/:addr/docs
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with created document or error.
 */
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

    // 422 - Validation error
    const required = { tokenId, owner, fileHash, uri, docType, action, signer }
    for (const [key, val] of Object.entries(required)) {
      if (!val)
        return failure(res, `Missing required field: ${key}`, 422)
    }

    // Build DTO
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

    const document = await DocumentService.createDocument(
      dto.toFirestore(),
      signer,
      action,
      txHash
    )

    return success(res, document, 201)
  } catch (err) {
    return handleError(res, err, "Failed to attach document", 500)
  }
}

/**
 * Retrieves all documents in the system.
 *
 * @route GET /documents
 * @param {Request} _req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with documents or error.
 */
export const getAllDocuments = async (_req: Request, res: Response) => {
  try {
    const docs = await DocumentService.getAllDocuments()
    return success(res, docs, 200)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents", 500)
  }
}

/**
 * Retrieves a document by its tokenId.
 *
 * @route GET /documents/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with document or error.
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params

    if (!tokenId || isNaN(+tokenId))
      return failure(res, "Invalid tokenId format", 422)

    const doc = await DocumentService.getDocumentById(+tokenId)

    if (!doc) return failure(res, "Document not found", 404)

    return success(res, doc, 200)
  } catch (err) {
    return handleError(res, err, "Failed to fetch document", 500)
  }
}

/**
 * Retrieves all documents owned by a specific owner.
 *
 * @route GET /documents/owner/:owner
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with documents or error.
 */
export const getDocumentsByOwner = async (req: Request, res: Response) => {
  try {
    const { owner } = req.params

    if (!owner)
      return failure(res, "Missing owner parameter", 422)

    const docs = await DocumentService.getDocumentsByOwner(owner)
    return success(res, docs, 200)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents by owner", 500)
  }
}

/**
 * Retrieves all documents linked to a specific contract address.
 *
 * @route GET /documents/contract/:addr
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with documents or error.
 */
export const getDocumentsByContract = async (req: Request, res: Response) => {
  try {
    const { addr } = req.params

    if (!addr)
      return failure(res, "Missing contract address", 422)

    const docs = await DocumentService.getDocumentsByContract(addr)
    return success(res, docs, 200)
  } catch (err) {
    return handleError(res, err, "Failed to fetch documents by contract", 500)
  }
}

/**
 * Retrieves the history/logs of a specific document.
 *
 * @route GET /documents/:tokenId/logs
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with document logs or error.
 */
export const getDocumentLogs = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params

    if (!tokenId || isNaN(+tokenId))
      return failure(res, "Invalid tokenId format", 422)

    const doc = await DocumentService.getDocumentById(+tokenId)

    if (!doc)
      return failure(res, "Document not found", 404)

    const logs = doc.history || []
    if (!logs.length)
      return failure(res, "No logs found", 404)

    return success(res, logs, 200)
  } catch (err) {
    return handleError(res, err, "Failed to fetch document logs", 500)
  }
}

/**
 * Updates an existing document.
 *
 * @route PATCH /documents/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with updated document or error.
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account, ...updateData } = req.body

    // Validasi 422
    if (!action)
      return failure(res, "Missing action field", 422)
    if (!account)
      return failure(res, "Missing account field", 422)

    if (!tokenId || isNaN(+tokenId))
      return failure(res, "Invalid tokenId format", 422)

    const updated = await DocumentService.updateDocument(
      +tokenId,
      updateData,
      account,
      action,
      txHash
    )

    if (!updated)
      return failure(res, "Document not found", 404)

    return success(res, updated, 200)
  } catch (err) {
    return handleError(res, err, "Failed to update document", 500)
  }
}

/**
 * Deletes a document by tokenId.
 *
 * @route DELETE /documents/:tokenId
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} JSON response with deletion status or error.
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account } = req.body

    // Validasi 422
    if (!action) return failure(res, "Missing action field", 422)
    if (!account) return failure(res, "Missing account field", 422)

    if (!tokenId || isNaN(+tokenId))
      return failure(res, "Invalid tokenId format", 422)

    const deleted = await DocumentService.deleteDocument(
      +tokenId,
      account,
      action,
      txHash
    )

    if (!deleted)
      return failure(res, "Document not found", 404)

    return success(res, { message: "Document deleted successfully" }, 200)
  } catch (err) {
    return handleError(res, err, "Failed to delete document", 500)
  }
}
