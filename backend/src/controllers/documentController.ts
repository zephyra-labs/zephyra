import { Request, Response } from "express"
import DocumentDTO from "../dtos/documentDTO.js"
import { DocumentService } from "../services/documentService.js"

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

    if (!tokenId || !owner || !fileHash || !uri || !docType) {
      return res.status(400).json({ success: false, message: "Missing required fields" })
    }
    if (!action) return res.status(400).json({ success: false, message: "Missing action field" })
    if (!signer) return res.status(400).json({ success: false, message: "Missing signer/account field" })

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
    return res.status(201).json({ success: true, data: document })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- GET /documents ---
export const getAllDocuments = async (_req: Request, res: Response) => {
  try {
    const docs = await DocumentService.getAllDocuments()
    return res.json({ success: true, data: docs })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- GET /documents/:tokenId ---
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const doc = await DocumentService.getDocumentById(+tokenId)
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" })
    return res.json({ success: true, data: doc })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- GET /documents/owner/:owner ---
export const getDocumentsByOwner = async (req: Request, res: Response) => {
  try {
    const { owner } = req.params
    const docs = await DocumentService.getDocumentsByOwner(owner)
    return res.json({ success: true, data: docs })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- GET /documents/contract/:addr ---
export const getDocumentsByContract = async (req: Request, res: Response) => {
  try {
    const { addr } = req.params
    const docs = await DocumentService.getDocumentsByContract(addr)
    return res.json({ success: true, data: docs })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- GET /documents/:tokenId/logs ---
export const getDocumentLogs = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const doc = await DocumentService.getDocumentById(+tokenId)
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" })

    const logs = doc.history || []
    if (!logs.length) return res.status(404).json({ success: false, message: "No logs found" })
    return res.json({ success: true, data: logs })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- PATCH /documents/:tokenId ---
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account, ...updateData } = req.body

    if (!action) return res.status(400).json({ success: false, message: "Missing action field" })
    if (!account) return res.status(400).json({ success: false, message: "Missing account field" })

    const updated = await DocumentService.updateDocument(+tokenId, updateData, account, action, txHash)
    return res.json({ success: true, data: updated })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// --- DELETE /documents/:tokenId ---
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params
    const { action, txHash, account } = req.body

    if (!action) return res.status(400).json({ success: false, message: "Missing action field" })
    if (!account) return res.status(400).json({ success: false, message: "Missing account field" })

    const success = await DocumentService.deleteDocument(+tokenId, account, action, txHash)
    if (!success) return res.status(404).json({ success: false, message: "Document not found" })
    return res.json({ success: true, message: "Document deleted successfully" })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
