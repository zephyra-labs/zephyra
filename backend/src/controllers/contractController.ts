import { Request, Response } from "express"
import { createPublicClient, http } from "viem"
import { Chain } from "../config/chain.js"
import { ContractService } from "../services/contractService.js"
import ContractLogDTO from "../dtos/contractDTO.js"
import type { AuthRequest } from "../middlewares/authMiddleware.js"

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
      return res.json({ success: true, data: contracts })
    } catch (err) {
      console.error("[ContractController.fetchDeployedContracts]", err)
      return res.status(500).json({ success: false, error: (err as Error).message })
    }
  }

  /**
   * POST /contracts/log
   * Tambahkan log baru + update state contract
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
        return res
          .status(400)
          .json({ success: false, error: "Missing required fields (contractAddress, action, txHash, account)" })
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
      return res.json({ success: true, log: saved })
    } catch (err) {
      console.error("[ContractController.logContractAction]", err)
      return res.status(500).json({ success: false, error: (err as Error).message })
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
      if (!contract) {
        return res.status(404).json({ success: false, error: "Contract not found" })
      }
      return res.json({ success: true, data: contract })
    } catch (err) {
      console.error("[ContractController.getContractDetails]", err)
      return res.status(500).json({ success: false, error: (err as Error).message })
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
      if (!result) {
        return res.status(404).json({ success: false, error: "Contract not found" })
      }
      return res.json({ success: true, data: result })
    } catch (err) {
      console.error("[ContractController.getContractStep]", err)
      return res.status(500).json({ success: false, error: (err as Error).message })
    }
  }

  /**
   * GET /contracts/my
   * Ambil semua kontrak milik user saat ini
   */
  static async getUserContracts(req: AuthRequest, res: Response) {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({ success: false, error: "Unauthorized" })
      }

      const contracts = await ContractService.getContractsByUser(user.address)
      return res.json({ success: true, data: contracts })
    } catch (err) {
      console.error("[ContractController.getUserContracts]", err)
      return res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
}
