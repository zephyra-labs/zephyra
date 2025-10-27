import { useActivityLogs } from "~/composables/useActivityLogs"
import { useApi } from "./useApi"
import type { Document, DocumentLogEntry } from "~/types/Document"

function safeParseDate(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || Date.now()
  return Date.now()
}

function parseDocument(d: any): Document {
  return {
    tokenId: Number(d?.tokenId) ?? 0,
    owner: d?.owner ?? "",
    fileHash: d?.fileHash ?? "",
    uri: d?.uri ?? "",
    docType: d?.docType ?? "Other",
    linkedContracts: Array.isArray(d?.linkedContracts) ? d.linkedContracts : [],
    createdAt: safeParseDate(d?.createdAt),
    updatedAt: safeParseDate(d?.updatedAt),
    signer: d?.signer ?? undefined,
    name: d?.name ?? "",
    description: d?.description ?? "",
    metadataUrl: d?.metadataUrl ?? "",
    status: d?.status ?? "Draft",
    history: Array.isArray(d?.history) ? d.history.map(parseDocumentLog) : [],
  }
}

function parseDocumentLog(d: any): DocumentLogEntry {
  return {
    action: d.action,
    account: d.account,
    signer: d.signer,
    txHash: d.txHash,
    linkedContract: d.linkedContract,
    extra: d.extra,
    timestamp: safeParseDate(d.timestamp),
    onChainInfo: d.onChainInfo,
  }
}

export function useDocuments() {
  const { request } = useApi()
  const { addActivityLog } = useActivityLogs()

  const getAllDocuments = async (): Promise<Document[]> => {
    try {
      const data = await request<{ data: Document[] }>("/document")
      return Array.isArray(data.data) ? data.data.map(parseDocument) : []
    } catch (err) {
      console.error("[getAllDocuments] Error:", err)
      return []
    }
  }

  const getDocumentById = async (tokenId: number): Promise<Document | null> => {
    try {
      const data = await request<{ data: Document }>(`/document/${tokenId}`)
      return data?.data ? parseDocument(data.data) : null
    } catch (err) {
      console.error(`[getDocumentById] Error ${tokenId}:`, err)
      return null
    }
  }

  const getDocumentsByOwner = async (owner: string): Promise<Document[]> => {
    try {
      const data = await request<{ data: Document[] }>(`/document/owner/${owner}`)
      return Array.isArray(data.data) ? data.data.map(parseDocument) : []
    } catch (err) {
      console.error(`[getDocumentsByOwner] Error ${owner}:`, err)
      return []
    }
  }

  const getDocumentsByContract = async (contractAddr: string): Promise<Document[]> => {
    try {
      const data = await request<{ data: Document[] }>(`/document/contract/${contractAddr}`)
      return Array.isArray(data.data) ? data.data.map(parseDocument) : []
    } catch (err) {
      console.error(`[getDocumentsByContract] Error ${contractAddr}:`, err)
      return []
    }
  }

  const getDocumentLogs = async (tokenId: number): Promise<DocumentLogEntry[]> => {
    try {
      const data = await request<{ data: { history: DocumentLogEntry[] } }>(
        `/document/${tokenId}/logs`
      )
      const history = data?.data?.history
      return Array.isArray(history) ? history.map(parseDocumentLog) : []
    } catch (err) {
      console.error(`[getDocumentLogs] Error ${tokenId}:`, err)
      return []
    }
  }

  const attachDocument = async (
    contractAddr: string,
    payload: Partial<Document>,
    account: string,
    txHash?: string
  ): Promise<Document> => {
    const data = await request<{ data: Document }>(`/document/contract/${contractAddr}/docs`, {
      method: "POST",
      body: JSON.stringify({ ...payload, action: "mintDocument", signer: account, txHash }),
    })

    const doc = parseDocument(data.data)

    await addActivityLog(doc.owner, {
      type: "backend",
      action: `Attach Document ${doc.tokenId}`,
      contractAddress: contractAddr,
      extra: { tokenId: doc.tokenId, name: doc.name },
      tags: ["document", "attach"],
    })

    return doc
  }

  interface UpdateDocumentArgs {
    tokenId: number
    payload: Partial<Document>
    account: string
    txHash?: string
    action?: string
    status?: string
  }

  const updateDocument = async ({
    tokenId,
    payload,
    account,
    txHash,
    action = "updateDocument",
    status,
  }: UpdateDocumentArgs): Promise<Document> => {
    const data = await request<{ data: Document }>(`/document/${tokenId}`, {
      method: "PATCH",
      body: JSON.stringify({ ...payload, action, account, txHash, status }),
    })

    const doc = parseDocument(data.data)

    await addActivityLog(account, {
      type: "backend",
      action: `Update Document ${tokenId}`,
      extra: { tokenId },
      tags: ["document", "update", action, status || ""],
    })

    return doc
  }

  const deleteDocument = async (tokenId: number, account: string, txHash?: string): Promise<boolean> => {
    const data = await request<{ success: boolean }>(`/document/${tokenId}`, {
      method: "DELETE",
      body: JSON.stringify({ action: "revokeDocument", account, txHash }),
    })

    await addActivityLog(account, {
      type: "backend",
      action: `Delete Document ${tokenId}`,
      extra: { tokenId },
      tags: ["document", "delete"],
    })

    return data?.success ?? true
  }

  return {
    getAllDocuments,
    getDocumentById,
    getDocumentsByOwner,
    getDocumentsByContract,
    getDocumentLogs,
    attachDocument,
    updateDocument,
    deleteDocument,
  }
}
