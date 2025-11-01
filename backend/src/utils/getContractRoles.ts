/**
 * @file getContractRoles.ts
 * @description Helper function to fetch the roles (importer, exporter, logistics) from a deployed contract log in Firestore.
 */

import { db } from "../config/firebase.js";

export interface ContractRoles {
  importer: string;
  exporter: string;
  logistics: string;
}

/**
 * Get roles for a specific contract from the first deploy log.
 *
 * @param {string} contractAddress - The address of the contract
 * @returns {Promise<ContractRoles>} Roles of the contract
 */
export const getContractRoles = async (contractAddress: string): Promise<ContractRoles> => {
  const contractsLogs = db.collection("contractLogs");
  const snapshot = await contractsLogs
    .where("contractAddress", "==", contractAddress)
    .get();

  if (snapshot.empty) return { importer: "", exporter: "", logistics: "" };

  // Ambil log deploy pertama
  const deployLog = snapshot.docs[0].data().history?.find((h: any) => h.action === "deploy");
  if (!deployLog || !deployLog.extra) return { importer: "", exporter: "", logistics: "" };

  const importer = deployLog.extra.importer || "";
  const exporter = deployLog.extra.exporter || "";
  const logistics = deployLog.extra.logistics || "";

  return { importer, exporter, logistics };
};
