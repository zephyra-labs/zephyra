import { db } from "../config/firebase.js"

const usersCollection = db.collection("users")
const contractsLogsCollection = db.collection("contractLogs")
const documentsCollection = db.collection("documents")
const documentLogsCollection = db.collection("documentLogs")

export class DashboardModel {
  static async getAllUsers() {
    const snap = await usersCollection.get()
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as { address?: string; balance?: number }),
    }))
  }

  static async getAllContracts() {
    const snap = await contractsLogsCollection.get()
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as { history?: any[] }),
    }))
  }

  static async getAllDocuments() {
    const snap = await documentsCollection.get()
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as {
        title?: string
        tokenId?: string
        owner?: string
        docType?: string
        status?: string
        createdAt?: number
        updatedAt?: number
        linkedContracts?: string[]
      }),
    }))
  }

  static async getDocumentLogs(id: string) {
    const snap = await documentLogsCollection.doc(id).get()
    return snap.exists ? (snap.data()?.history ?? []) : []
  }
}
