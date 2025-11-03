/**
 * @file getContractRoles.ts
 * @description Helper function to fetch the roles (importer, exporter, logistics) from a deployed contract log in Firestore.
 */

import { db } from "../config/firebase";
import type { ContractLogEntry, ContractRoles } from "../types/Contract";

/**
 * Get roles for a specific contract from the first deploy log.
 *
 * @param contractAddress - The address of the contract
 * @returns Roles of the contract
 */
export const getContractRoles = async (
  contractAddress: string
): Promise<ContractRoles> => {
  const contractsLogs = db.collection("contractLogs");
  const snapshot = await contractsLogs
    .where("contractAddress", "==", contractAddress)
    .get();

  if (snapshot.empty) return { importer: "", exporter: "", logistics: "" };

  const history: ContractLogEntry[] = snapshot.docs[0].data().history ?? [];
  const deployLog = history.find(h => h.action === "deploy");

  if (!deployLog?.extra) return { importer: "", exporter: "", logistics: "" };

  const { importer = "", exporter = "", logistics = "" } = deployLog.extra;

  return { importer, exporter, logistics };
};
