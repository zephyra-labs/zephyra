import { db } from "../config/firebase.js"

export const getContractRoles = async (contractAddress: string) => {
  const contractsLogs = db.collection("contractLogs")
  const snapshot = await contractsLogs
    .where("contractAddress", "==", contractAddress)
    .get()

  if (snapshot.empty) return { importer: "", exporter: "", logistics: "" }

  const deployLog = snapshot.docs[0].data().history?.find((h: any) => h.action === "deploy")
  if (!deployLog || !deployLog.extra) return { importer: "", exporter: "", logistics: "" }

  const importer = deployLog.extra.importer || ""
  const exporter = deployLog.extra.exporter || ""
  const logistics = deployLog.extra.logistics || ""
  
  return { importer, exporter, logistics }
}
