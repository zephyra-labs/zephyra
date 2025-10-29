import { Request, Response } from "express"
import { createPublicClient, http } from "viem"
import { Chain } from "../config/chain.js"
import { ContractService } from "../services/contractService.js"
import ContractLogDTO from "../dtos/contractDTO.js"
import type { AuthRequest } from "../middlewares/authMiddleware.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

// --- Public client untuk query blockchain ---
const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

// --- Helper: verifikasi transaksi on-chain ---
const verifyTransaction = async (txHash: string) => {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })
    if (!receipt || receipt.blockNumber === undefined) return undefined

    const latestBlock = await publicClient.getBlockNumber()
    return {
      status: receipt.status ? "success" : "failed",
      blockNumber: Number(receipt.blockNumber),
      confirmations: Number(latestBlock - receipt.blockNumber + 1n),
    }
  } catch (err) {
    console.warn("[verifyTransaction] Failed:", err)
    return undefined
  }
}

// --- Controller ---
export class ContractController {
  /**
   * GET /contracts
   * Ambil semua kontrak yang sudah ter-deploy
   */
  static async fetchDeployedContracts(_req: Request, res: Response) {
    try {
      const contracts = await ContractService.getAllContracts()
      return success(res, contracts)
    } catch (err) {
      return handleError(res, err, "Failed to fetch deployed contracts")
    }
  }

  /**
   * POST /contracts/log
   * Tambahkan log baru + update state contract
   * 
   * Optional fields for logistics management:
   * - extra.addLogistics: string[] → daftar address logistics baru yang akan ditambahkan
   * - extra.removeLogistics: string[] → daftar address logistics yang akan dihapus
   */
  static async logContractAction(req: Request, res: Response) {
    try {
      const {
        contractAddress,
        action,
        txHash,
        account,
        exporter,
        importer,
        logistics,
        insurance,
        inspector,
        requiredAmount,
        status,
        currentStage,
        extra,
        verifyOnChain,
      } = req.body as Partial<ContractLogDTO>

      if (!contractAddress || !action || !txHash || !account) {
        return failure(res, "Missing required fields (contractAddress, action, txHash, account)")
      }

      // Verifikasi transaksi blockchain bila diminta
      let onChainInfo
      if (verifyOnChain) {
        onChainInfo = await verifyTransaction(txHash)
      }

      // Buat DTO
      const dto = new ContractLogDTO({
        contractAddress,
        action,
        txHash,
        account,
        exporter,
        importer,
        logistics,
        insurance,
        inspector,
        requiredAmount,
        status,
        currentStage,
        extra: extra ?? {},
        timestamp: Date.now(),
        onChainInfo,
        verifyOnChain,
      })

      dto.validate()

      // Simpan log + update state
      const saved = await ContractService.addContractLog(dto)
      return success(res, saved, 201)
    } catch (err) {
      return handleError(res, err, "Failed to log contract action")
    }
  }

  /**
   * GET /contracts/:address/details
   * Ambil data lengkap satu kontrak
   */
  static async getContractDetails(req: Request, res: Response) {
    try {
      const { address } = req.params
      const contract = await ContractService.getContractById(address)
      if (!contract) return failure(res, "Contract not found", 404)
      return success(res, contract)
    } catch (err) {
      return handleError(res, err, "Failed to fetch contract details")
    }
  }

  /**
   * GET /contracts/:address/step
   * Ambil status tahapan kontrak (deploy, deposit, approve, finalize)
   */
  static async getContractStep(req: Request, res: Response) {
    try {
      const { address } = req.params
      const result = await ContractService.getContractStepStatus(address)
      if (!result) return failure(res, "Contract not found", 404)
      return success(res, result)
    } catch (err) {
      return handleError(res, err, "Failed to fetch contract step")
    }
  }

  /**
   * GET /contracts/my
   * Ambil semua kontrak milik user saat ini
   */
  static async getUserContracts(req: AuthRequest, res: Response) {
    try {
      const user = req.user
      if (!user) return failure(res, "Unauthorized", 401)

      const contracts = await ContractService.getContractsByUser(user.address)
      return success(res, contracts)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user contracts")
    }
  }
}
