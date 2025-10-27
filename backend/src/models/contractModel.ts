import admin from "firebase-admin"
import { db } from "../config/firebase.js"
import type { ContractLogs, ContractLogEntry, ContractState } from "../types/Contract.js"

const collection = db.collection("contractLogs")

export class ContractModel {
  // --- Tambah log + update state ---
  static async addContractLog(
    entry: ContractLogEntry,
    contractAddress: string,
    newState?: Partial<ContractState>
  ) {
    const docRef = collection.doc(contractAddress)
    const doc = await docRef.get()

    if (doc.exists) {
      const data = doc.data() as ContractLogs

      // Merge state baru ke state lama
      const updatedState: ContractState = {
        ...data.state,
        ...newState,
        lastUpdated: Date.now(),
      }

      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(entry),
        state: updatedState,
      })
    } else {
      const initialState: ContractState = {
        ...newState,
        lastUpdated: Date.now(),
        status: entry.action,
        currentStage: "1",
      }

      await docRef.set({
        contractAddress,
        state: initialState,
        history: [entry],
      })
    }
  }

  // --- Ambil semua contract ---
  static async getAllContracts(): Promise<ContractLogs[]> {
    const snapshot = await collection.get()
    return snapshot.docs.map((doc) => {
      const data = doc.data() as ContractLogs
      return { ...data, contractAddress: doc.id }
    })
  }

  // --- Ambil contract by ID ---
  static async getContractById(contractAddress: string): Promise<ContractLogs | null> {
    const doc = await collection.doc(contractAddress).get()
    return doc.exists ? (doc.data() as ContractLogs) : null
  }

  // --- Ambil contracts by user ---
  static async getContractsByUser(
    userAddress: string
  ): Promise<(ContractLogs & { role: "Exporter" | "Importer" | "Logistics" })[]> {
    const snapshot = await collection.get()
    const contracts: Array<ContractLogs & { role: "Exporter" | "Importer" | "Logistics" }> = []

    for (const doc of snapshot.docs) {
      const data = doc.data() as ContractLogs
      const roles = data.state ?? (await import("../utils/getContractRoles.js").then((m) => m.getContractRoles(doc.id)))

      if (roles.exporter === userAddress) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Exporter" })
      } else if (roles.importer === userAddress) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Importer" })
      } else if (roles.logistics === userAddress) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Logistics" })
      }
    }

    return contracts
  }

  // --- Ambil step status contract ---
  static async getContractStepStatus(contractAddress: string) {
    const doc = await collection.doc(contractAddress).get()
    if (!doc.exists) return null

    const data = doc.data() as ContractLogs
    const history: ContractLogEntry[] = data.history ?? []

    const stepStatus: Record<
      "deploy" | "deposit" | "approveImporter" | "approveExporter" | "finalize",
      boolean
    > = {
      deploy: false,
      deposit: false,
      approveImporter: false,
      approveExporter: false,
      finalize: false,
    }

    history.forEach((log) => {
      switch (log.action) {
        case "deploy":
          stepStatus.deploy = true
          break
        case "deposit":
          stepStatus.deposit = true
          break
        case "approveImporter":
        case "approve_importer":
          stepStatus.approveImporter = true
          break
        case "approveExporter":
        case "approve_exporter":
          stepStatus.approveExporter = true
          break
        case "finalize":
          stepStatus.finalize = true
          break
      }
    })

    return {
      stepStatus,
      lastAction: history[history.length - 1] ?? null,
    }
  }

  // --- Update hanya state tanpa log ---
  static async updateContractState(contractAddress: string, newState: Partial<ContractState>) {
    const docRef = collection.doc(contractAddress)
    const doc = await docRef.get()
    if (!doc.exists) throw new Error("Contract not found")

    const currentState = (doc.data() as ContractLogs).state ?? {}
    const mergedState: ContractState = {
      ...currentState,
      ...newState,
      lastUpdated: Date.now(),
    }

    await docRef.update({ state: mergedState })
    return mergedState
  }
}
