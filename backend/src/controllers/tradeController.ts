import { Request, Response } from "express"
import { TradeService } from "../services/tradeService.js"
import type { AuthRequest } from "../middlewares/authMiddleware.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

// --- Controller ---
export class TradeController {
  /**
   * GET /trades
   * Ambil semua trade
   */
  static async fetchAllTrades(_req: Request, res: Response) {
    try {
      const trades = await TradeService.getAllTrades()
      return success(res, trades)
    } catch (err) {
      return handleError(res, err, "Failed to fetch trades")
    }
  }

  /**
   * GET /trades/:id
   * Ambil trade by ID
   */
  static async getTradeById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const trade = await TradeService.getTradeById(id)
      if (!trade) return failure(res, "Trade not found", 404)
      return success(res, trade)
    } catch (err) {
      return handleError(res, err, "Failed to fetch trade")
    }
  }

  /**
   * POST /trades
   * Buat trade baru
   */
  static async createTrade(req: Request, res: Response) {
    try {
      const { participants } = req.body
      if (!participants || !Array.isArray(participants)) {
        return failure(res, "Participants are required")
      }

      const trade = await TradeService.createTrade(participants)
      return success(res, trade, 201)
    } catch (err) {
      return handleError(res, err, "Failed to create trade")
    }
  }

  /**
   * POST /trades/:id/participant
   * Tambah participant ke trade
   */
  static async addParticipant(req: Request, res: Response) {
    try {
      const { id } = req.params
      const participant = req.body
      if (!participant || !participant.address) {
        return failure(res, "Participant data is required")
      }

      const trade = await TradeService.addParticipant(id, participant)
      return success(res, trade)
    } catch (err) {
      return handleError(res, err, "Failed to add participant")
    }
  }

  /**
   * PATCH /trades/:id/role
   * Assign role participant
   */
  static async assignRole(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { address, role } = req.body
      if (!address || !role) {
        return failure(res, "Participant address and role are required")
      }

      const participants = await TradeService.assignRole(id, address, role)
      return success(res, participants)
    } catch (err) {
      return handleError(res, err, "Failed to assign role")
    }
  }

  /**
   * PATCH /trades/:id/status
   * Update status trade
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      if (!status) return failure(res, "Status is required")

      const trade = await TradeService.updateStatus(id, status)
      return success(res, trade)
    } catch (err) {
      return handleError(res, err, "Failed to update trade status")
    }
  }

  /**
   * GET /trades/my
   * Ambil semua trade untuk user tertentu
   */
  static async getMyTrades(req: AuthRequest, res: Response) {
    try {
      const user = req.user
      if (!user) return failure(res, "Unauthorized", 401)

      const trades = await TradeService.getTradesByParticipant(user.address)
      return success(res, trades)
    } catch (err) {
      return handleError(res, err, "Failed to fetch user trades")
    }
  }
}
