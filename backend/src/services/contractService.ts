import { ContractModel } from "../models/contractModel.js"
import ContractLogDTO from "../dtos/contractDTO.js"
import { notifyUsers, notifyWithAdmins } from "../utils/notificationHelper.js"
import { getContractRoles } from "../utils/getContractRoles.js"
import type { ContractLogEntry } from "../types/Contract.js"

export class ContractService {
  /**
   * Tambah log baru ke contract dan update state-nya
   */
  static async addContractLog(data: Partial<ContractLogDTO>): Promise<ContractLogEntry> {
    const dto = new ContractLogDTO(data as any)
    dto.validate()

    const logEntry: ContractLogEntry = dto.toLogEntry()
    let newState = dto.toState()

    // fallback roles jika DTO tidak lengkap
    if (!dto.exporter || !dto.importer || !dto.logistics) {
      const roles = await getContractRoles(dto.contractAddress)
      newState.exporter = newState.exporter ?? roles.exporter
      newState.importer = newState.importer ?? roles.importer
      newState.logistics = newState.logistics ?? roles.logistics
    }

    // --- Ambil dokumen contract dari DB ---
    const doc = await ContractModel.getContractById(dto.contractAddress)

    if (!doc) {
      // Dokumen belum ada → deploy pertama
      const initialState = {
        exporter: logEntry.extra?.exporter ?? newState.exporter,
        importer: logEntry.extra?.importer ?? newState.importer,
        logistics: logEntry.extra?.logistics ?? newState.logistics,
        status: logEntry.action,
        currentStage: "1",
        lastUpdated: Date.now(),
      }

      await ContractModel.addContractLog(logEntry, dto.contractAddress, initialState)
    } else {
      // Dokumen sudah ada → merge state dari log terbaru
      const mergedState = {
        ...doc.state,
        ...newState,
        exporter: logEntry.extra?.exporter ?? newState.exporter ?? doc.state.exporter,
        importer: logEntry.extra?.importer ?? newState.importer ?? doc.state.importer,
        logistics: logEntry.extra?.logistics ?? newState.logistics ?? doc.state.logistics,
        status: logEntry.action,
        currentStage: logEntry.extra?.stage ?? doc.state.currentStage ?? "1",
        lastUpdated: Date.now(),
      }

      await ContractModel.addContractLog(logEntry, dto.contractAddress, mergedState)
    }

    // --- Notifikasi ke admin & participants ---
    const payload = {
      type: "agreement",
      title: `Contract Action: ${dto.action}`,
      message: `Contract ${dto.contractAddress} has a new action "${dto.action}" by ${dto.account}.`,
      txHash: dto.txHash,
      data: {
        contractAddress: dto.contractAddress,
        action: dto.action,
        txHash: dto.txHash,
      },
    }

    await notifyWithAdmins(dto.account, payload)

    const participants = [newState.exporter, newState.importer, newState.logistics].filter(Boolean) as string[]
    if (participants.length) {
      await notifyUsers(participants, payload, dto.account)
    }

    return logEntry
  }

  /**
   * Ambil semua contract
   */
  static async getAllContracts() {
    return ContractModel.getAllContracts()
  }

  /**
   * Ambil contract berdasarkan address
   */
  static async getContractById(address: string) {
    return ContractModel.getContractById(address)
  }

  /**
   * Ambil semua contract yang terkait dengan user tertentu
   */
  static async getContractsByUser(address: string) {
    const contracts = await ContractModel.getContractsByUser(address)
    const result = []

    for (const c of contracts) {
      const roles = c.state ?? (await getContractRoles(c.contractAddress))
      if (roles.exporter === address) result.push({ ...c, role: "Exporter" })
      else if (roles.importer === address) result.push({ ...c, role: "Importer" })
      else if (roles.logistics === address) result.push({ ...c, role: "Logistics" })
    }

    return result
  }

  /**
   * Ambil status tahapan dari contract
   */
  static async getContractStepStatus(contractAddress: string) {
    const contract = await ContractModel.getContractById(contractAddress)
    if (!contract) return null

    const history: ContractLogEntry[] = contract.history ?? []

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
}
