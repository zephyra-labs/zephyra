/**
 * @file contractService.ts
 * @description Business logic for managing contracts, contract logs, participants, and notifications.
 */

import { ContractModel } from "../models/contractModel.js";
import ContractLogDTO from "../dtos/contractDTO.js";
import { notifyUsers, notifyWithAdmins } from "../utils/notificationHelper.js";
import { getContractRoles } from "../utils/getContractRoles.js";
import type { ContractLogEntry, ContractState } from "../types/Contract.js";

export class ContractService {
  /**
   * Add a new log to a contract and update its state.
   * Handles first deployment or merges with existing state.
   * Supports adding/removing logistics.
   *
   * @async
   * @param {Partial<ContractLogDTO>} data - Data to create contract log.
   * @returns {Promise<ContractLogEntry>} Newly created log entry.
   * @throws {Error} If DTO validation fails or logistic already added/removed.
   */
  static async addContractLog(data: Partial<ContractLogDTO>): Promise<ContractLogEntry> {
    const dto = new ContractLogDTO(data as ContractLogDTO);
    dto.validate();

    const logEntry: ContractLogEntry = dto.toLogEntry();
    const newState = dto.toState();

    // fallback roles jika DTO tidak lengkap
    if (!dto.exporter || !dto.importer || !dto.logistics) {
      const roles = await getContractRoles(dto.contractAddress);
      newState.exporter = newState.exporter ?? roles.exporter;
      newState.importer = newState.importer ?? roles.importer;
      newState.logistics = newState.logistics ?? (Array.isArray(roles.logistics) ? roles.logistics : roles.logistics ? [roles.logistics] : []);
    }

    // Ambil kontrak dari DB
    const doc = await ContractModel.getContractById(dto.contractAddress);

    // State awal atau merge
    let mergedState: ContractState;
    if (!doc) {
      // Deploy pertama
      mergedState = {
        exporter: logEntry.extra?.exporter ?? newState.exporter,
        importer: logEntry.extra?.importer ?? newState.importer,
        logistics: newState.logistics ?? [],
        status: logEntry.action,
        currentStage: "1",
        lastUpdated: Date.now(),
      };
    } else {
      // Merge state lama + log baru
      mergedState = {
        ...doc.state,
        exporter: logEntry.extra?.exporter ?? newState.exporter ?? doc.state.exporter,
        importer: logEntry.extra?.importer ?? newState.importer ?? doc.state.importer,
        logistics: [...(doc.state.logistics ?? [])],
        status: logEntry.action,
        currentStage: typeof logEntry.extra?.stage === 'string' ? logEntry.extra.stage : doc.state.currentStage ?? "1",
        lastUpdated: Date.now(),
      };

      // Handle add/remove logistics
      if (logEntry.action === "addLogistic" && typeof logEntry.extra?.logistic === 'string') {
        mergedState.logistics = mergedState.logistics || [];
        if (!mergedState.logistics.includes(logEntry.extra.logistic)) {
          mergedState.logistics.push(logEntry.extra.logistic);
        } else {
          throw new Error(`Logistic ${logEntry.extra.logistic} already added`);
        }
      }
      if (logEntry.action === "removeLogistic" && typeof logEntry.extra?.logistic === 'string') {
        mergedState.logistics = mergedState.logistics || [];
        if (mergedState.logistics.includes(logEntry.extra.logistic)) {
          const logistic = logEntry.extra.logistic;
          mergedState.logistics = mergedState.logistics.filter((l: string) => l !== logistic);
        } else {
          throw new Error(`Logistic ${logEntry.extra.logistic} not found`);
        }
      }
    }

    // Simpan log + update state
    await ContractModel.addContractLog(logEntry, dto.contractAddress, mergedState);

    // --- Notifikasi ---
    const payload = {
      type: "agreement" as const,
      title: `Contract Action: ${dto.action}`,
      message: `Contract ${dto.contractAddress} has a new action "${dto.action}" by ${dto.account}.`,
      txHash: dto.txHash,
      data: {
        contractAddress: dto.contractAddress,
        action: dto.action,
        txHash: dto.txHash,
      },
    };

    await notifyWithAdmins(dto.account, payload);

    const participants = [mergedState.exporter, mergedState.importer, ...(mergedState.logistics ?? [])].filter((p): p is string => Boolean(p));
    if (participants.length) {
      await notifyUsers(participants, payload, dto.account);
    }

    return logEntry;
  }

  /**
   * Get all contracts.
   *
   * @async
   * @returns {Promise<any[]>} List of all contracts.
   */
  static async getAllContracts() {
    return ContractModel.getAllContracts();
  }

  /**
   * Get a contract by its address.
   *
   * @async
   * @param {string} address - Contract address.
   * @returns {Promise<any | null>} Contract data or null if not found.
   */
  static async getContractById(address: string) {
    return ContractModel.getContractById(address);
  }

  /**
   * Get all contracts related to a specific user (based on role: exporter, importer, logistics).
   *
   * @async
   * @param {string} address - User wallet address.
   * @returns {Promise<any[]>} List of contracts with role assigned.
   */
  static async getContractsByUser(address: string) {
    const contracts = await ContractModel.getContractsByUser(address);
    const result = [];

    for (const c of contracts) {
      const roles = c.state ?? (await getContractRoles(c.contractAddress));
      if (roles.exporter === address) result.push({ ...c, role: "Exporter" });
      else if (roles.importer === address) result.push({ ...c, role: "Importer" });
      else if (Array.isArray(roles.logistics) ? roles.logistics.includes(address) : roles.logistics === address) result.push({ ...c, role: "Logistics" });
    }

    return result;
  }

  /**
   * Get the status of each step in the contract lifecycle.
   *
   * @async
   * @param {string} contractAddress - Contract address.
   * @returns {Promise<{ stepStatus: Record<string, boolean>; lastAction: ContractLogEntry | null } | null>}
   *   Object containing step status and last action, or null if contract not found.
   */
  static async getContractStepStatus(contractAddress: string) {
    const contract = await ContractModel.getContractById(contractAddress);
    if (!contract) return null;

    const history: ContractLogEntry[] = contract.history ?? [];

    const stepStatus: Record<"deploy" | "deposit" | "approveImporter" | "approveExporter" | "finalize", boolean> = {
      deploy: false,
      deposit: false,
      approveImporter: false,
      approveExporter: false,
      finalize: false,
    };

    history.forEach((log) => {
      switch (log.action) {
        case "deploy":
          stepStatus.deploy = true;
          break;
        case "deposit":
          stepStatus.deposit = true;
          break;
        case "approveImporter":
        case "approve_importer":
          stepStatus.approveImporter = true;
          break;
        case "approveExporter":
        case "approve_exporter":
          stepStatus.approveExporter = true;
          break;
        case "finalize":
          stepStatus.finalize = true;
          break;
      }
    });

    return {
      stepStatus,
      lastAction: history[history.length - 1] ?? null,
    };
  }
}
