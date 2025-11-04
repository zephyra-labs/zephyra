/**
 * @file ContractModel.ts
 * @description Firestore model for managing contract logs and contract state
 */

import admin from "firebase-admin";
import { db } from "../config/firebase";
import type { ContractLogs, ContractLogEntry, ContractState } from "../types/Contract";

/** Firestore collection reference for contract logs */
const collection = db.collection("contractLogs");

/**
 * Firestore model for contract logs and states
 */
export class ContractModel {
  /**
   * Add a contract log entry and optionally update the contract state
   * @param entry Contract log entry
   * @param contractAddress Contract's unique address
   * @param newState Optional state to merge into current state
   */
  static async addContractLog(
    entry: ContractLogEntry,
    contractAddress: string,
    newState?: Partial<ContractState>
  ): Promise<void> {
    const docRef = collection.doc(contractAddress);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data() as ContractLogs;

      // Merge new state into existing state
      const updatedState: ContractState = {
        ...data.state,
        ...newState,
        lastUpdated: Date.now(),
      };

      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(entry),
        state: updatedState,
      });
    } else {
      const initialState: ContractState = {
        ...newState,
        lastUpdated: Date.now(),
        status: entry.action,
        currentStage: "1",
      };

      await docRef.set({
        contractAddress,
        state: initialState,
        history: [entry],
      });
    }
  }

  /**
   * Get all contracts
   * @returns Array of contracts including state and history
   */
  static async getAllContracts(): Promise<ContractLogs[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() as ContractLogs;
      return { ...data, contractAddress: doc.id };
    });
  }

  /**
   * Get a contract by its address
   * @param contractAddress Contract's unique address
   * @returns ContractLogs or null if not found
   */
  static async getContractById(contractAddress: string): Promise<ContractLogs | null> {
    const doc = await collection.doc(contractAddress).get();
    return doc.exists ? (doc.data() as ContractLogs) : null;
  }

  /**
   * Get all contracts associated with a user
   * @param userAddress User wallet address
   * @returns Array of contracts including user's role
   */
  static async getContractsByUser(
    userAddress: string
  ): Promise<(ContractLogs & { role: "Exporter" | "Importer" | "Logistics" })[]> {
    const snapshot = await collection.get();
    const contracts: Array<ContractLogs & { role: "Exporter" | "Importer" | "Logistics" }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as ContractLogs;
      const roles =
        data.state ??
        (await import("../utils/getContractRoles").then((m) => m.getContractRoles(doc.id)));

      if (roles.exporter === userAddress) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Exporter" });
      } else if (roles.importer === userAddress) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Importer" });
      } else if (roles.logistics?.includes(userAddress)) {
        contracts.push({ ...data, contractAddress: doc.id, role: "Logistics" });
      }
    }

    return contracts;
  }

  /**
   * Get the step status of a contract based on its logs
   * @param contractAddress Contract's unique address
   * @returns Object containing step status and last action
   */
  static async getContractStepStatus(contractAddress: string): Promise<{
    stepStatus: Record<
      "deploy" | "deposit" | "approveImporter" | "approveExporter" | "finalize",
      boolean
    >;
    lastAction: ContractLogEntry | null;
  } | null> {
    const doc = await collection.doc(contractAddress).get();
    if (!doc.exists) return null;

    const data = doc.data() as ContractLogs;
    const history: ContractLogEntry[] = data.history ?? [];

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

    return {
      stepStatus,
      lastAction: history[history.length - 1] ?? null,
    };
  }

  /**
   * Update only the contract state without adding a log entry
   * @param contractAddress Contract's unique address
   * @param newState New state to merge
   * @returns Updated ContractState
   * @throws Error if contract not found
   */
  static async updateContractState(
    contractAddress: string,
    newState: Partial<ContractState>
  ): Promise<ContractState> {
    const docRef = collection.doc(contractAddress);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Contract not found");

    const currentState = (doc.data() as ContractLogs).state ?? {};
    const mergedState: ContractState = {
      ...currentState,
      ...newState,
      lastUpdated: Date.now(),
    };

    await docRef.update({ state: mergedState });
    return mergedState;
  }
}
