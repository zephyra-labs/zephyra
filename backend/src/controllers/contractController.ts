/**
 * @file contractController.ts
 * @description Express controller for managing contracts, contract logs, and user-specific contract data.
 * Supports fetching deployed contracts, adding logs, retrieving contract details, and checking contract steps.
 */

import { Request, Response } from "express"
import { createPublicClient, http } from "viem"
import { Chain } from "../config/chain"
import { ContractService } from "../services/contractService"
import ContractLogDTO from "../dtos/contractDTO"
import type { AuthRequest } from "../middlewares/authMiddleware"
import { success, failure, handleError } from "../utils/responseHelper"

// --- Public client untuk query blockchain ---
const publicClient = createPublicClient({
  chain: Chain,
  transport: http(Chain.rpcUrls.default.http[0]),
})

/**
 * Verifies a transaction on-chain using Viem public client.
 *
 * @param {string} txHash - Transaction hash to verify.
 * @returns {Promise<{status: "success"|"failed"; blockNumber: number; confirmations: number} | undefined>}
 */
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

export class ContractController {
  /**
   * Fetch all deployed contracts.
   *
   * @route GET /contracts
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with list of deployed contracts.
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
   * Add a new log to a contract and update its state.
   *
   * Optional fields for logistics management:
   * - extra.addLogistics: string[] → addresses to add
   * - extra.removeLogistics: string[] → addresses to remove
   *
   * @route POST /contracts/log
   * @param {Request} req - Express request object with log data in body.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with saved contract log.
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

      let onChainInfo
      if (verifyOnChain) {
        onChainInfo = await verifyTransaction(txHash)
      }

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
      const saved = await ContractService.addContractLog(dto)
      return success(res, saved, 201)
    } catch (err) {
      return handleError(res, err, "Failed to log contract action")
    }
  }

  /**
   * Get detailed information of a specific contract.
   *
   * @route GET /contracts/:address/details
   * @param {Request} req - Express request object with contract address param.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with contract details or error.
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
   * Get the current step/status of a contract (e.g., deploy, deposit, approve, finalize).
   *
   * @route GET /contracts/:address/step
   * @param {Request} req - Express request object with contract address param.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with contract step status or error.
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
   * Get all contracts belonging to the authenticated user.
   *
   * @route GET /contracts/my
   * @param {AuthRequest} req - Express request object with user info from auth middleware.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with user's contracts or error.
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
