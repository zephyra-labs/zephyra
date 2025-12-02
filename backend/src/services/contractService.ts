/**
 * @file contractService.ts
 * @description Business logic for managing contracts, contract logs, participants, and notifications.
 */

import { ContractModel } from "../models/contractModel";
import ContractLogDTO from "../dtos/contractDTO";
import { notifyUsers, notifyWithAdmins } from "../utils/notificationHelper";
import { getContractRoles } from "../utils/getContractRoles";
import type { ContractLogEntry, ContractState } from "../types/Contract";

export class ContractService {
  /**
   * Add a new log to a contract and update its state.
   */
  static async addContractLog(data: Partial<ContractLogDTO>): Promise<ContractLogEntry> {
    const dto = new ContractLogDTO(data as ContractLogDTO);
    dto.validate();

    const logEntry: ContractLogEntry = dto.toLogEntry();
    const newState = dto.toState();

    if (!dto.exporter || !dto.importer || !dto.logistics) {
      const roles = await getContractRoles(dto.contractAddress);
      newState.exporter ??= roles.exporter;
      newState.importer ??= roles.importer;
      newState.logistics ??= Array.isArray(roles.logistics)
        ? roles.logistics
        : roles.logistics
        ? [roles.logistics]
        : [];
    }

    const doc = await ContractModel.getContractById(dto.contractAddress);

    let mergedState: ContractState;

    if (!doc) {
      mergedState = {
        exporter: logEntry.extra?.exporter ?? newState.exporter,
        importer: logEntry.extra?.importer ?? newState.importer,
        logistics: newState.logistics,
        status: logEntry.action,
        currentStage: "1",
        lastUpdated: Date.now(),
      };
    } else {
      mergedState = {
        ...doc.state,
        exporter: logEntry.extra?.exporter ?? newState.exporter ?? doc.state.exporter,
        importer: logEntry.extra?.importer ?? newState.importer ?? doc.state.importer,
        status: logEntry.action,
        currentStage:
          typeof logEntry.extra?.stage === "string"
            ? logEntry.extra.stage
            : doc.state.currentStage ?? "1",
        lastUpdated: Date.now(),
      };

      mergedState.logistics ??= [];

      if (logEntry.action === "addLogistic" && typeof logEntry.extra?.logistic === "string") {
        if (!mergedState.logistics.includes(logEntry.extra.logistic)) {
          mergedState.logistics.push(logEntry.extra.logistic);
        } else {
          throw new Error(`Logistic ${logEntry.extra.logistic} already added`);
        }
      }

      if (logEntry.action === "removeLogistic" && typeof logEntry.extra?.logistic === "string") {
        if (mergedState.logistics.includes(logEntry.extra.logistic)) {
          mergedState.logistics = mergedState.logistics.filter(
            (l) => l !== logEntry.extra!.logistic
          );
        } else {
          throw new Error(`Logistic ${logEntry.extra.logistic} not found`);
        }
      }
    }

    await ContractModel.addContractLog(logEntry, dto.contractAddress, mergedState);

    const payload = {
      type: "agreement" as const,
      title: `Contract Action: ${dto.action}`,
      message: `Contract ${dto.contractAddress} has a new action "${dto.action}" by ${dto.account}.`,
      txHash: dto.txHash,
      data: { contractAddress: dto.contractAddress, action: dto.action, txHash: dto.txHash },
    };

    await notifyWithAdmins(dto.account, payload);
    
    const participants = [mergedState.exporter, mergedState.importer, ...(mergedState.logistics ?? [])].filter(
      (addr): addr is string => !!addr && addr !== dto.account
    );
    
    if (participants.length) {
      await notifyUsers(participants, payload, dto.account);
    }

    return logEntry;
  }

  static async getAllContracts() {
    return ContractModel.getAllContracts();
  }

  static async getContractById(address: string) {
    return ContractModel.getContractById(address);
  }

  static async getContractsByUser(address: string) {
    const contracts = await ContractModel.getContractsByUser(address);
    const result: (typeof contracts[number] & { role: "Exporter" | "Importer" | "Logistics" })[] =
      [];

    for (const c of contracts) {
      const roles = c.state ?? (await getContractRoles(c.contractAddress));
      if (roles.exporter === address) result.push({ ...c, role: "Exporter" });
      else if (roles.importer === address) result.push({ ...c, role: "Importer" });
      else if (Array.isArray(roles.logistics)
        ? roles.logistics.includes(address)
        : roles.logistics === address
      )
        result.push({ ...c, role: "Logistics" });
    }

    return result;
  }

  static async getContractStepStatus(contractAddress: string) {
    const contract = await ContractModel.getContractById(contractAddress);
    if (!contract) return null;

    const history: ContractLogEntry[] = contract.history ?? [];

    const stepStatus: Record<
      "deploy" | "deposit" | "approveImporter" | "approveExporter" | "finalize",
      boolean
    > = {
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

    return { stepStatus, lastAction: history[history.length - 1] ?? null };
  }
}
