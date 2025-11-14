/**
 * @file tradeController.ts
 * @description Express controller for trade-related endpoints.
 */

import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware";
import { TradeService } from "../services/tradeService";
import { success, failure, handleError } from "../utils/responseHelper";

/**
 * Trade controller
 */
export class TradeController {
  /**
   * GET /trades
   * Fetch all trades.
   *
   * @param {Request} _req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async fetchAllTrades(_req: Request, res: Response) {
    try {
      const trades = await TradeService.getAllTrades();
      return success(res, trades, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch trades", 500);
    }
  }

  /**
   * GET /trades/:id
   * Fetch trade by ID.
   *
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async getTradeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return failure(res, "Missing id parameter", 422);

      const trade = await TradeService.getTradeById(id);
      if (!trade) return failure(res, "Trade not found", 404);

      return success(res, trade, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch trade", 500);
    }
  }

  /**
   * POST /trades
   * Create a new trade.
   *
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async createTrade(req: Request, res: Response) {
    try {
      const { participants } = req.body;
      if (!participants || !Array.isArray(participants)) {
        return failure(res, "Participants are required", 400);
      }

      const trade = await TradeService.createTrade(participants);
      return success(res, trade, 201);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to create trade", 500);
    }
  }

  /**
   * POST /trades/:id/participant
   * Add a participant to a trade.
   *
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async addParticipant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return failure(res, "Missing trade id parameter", 422);

      const participant = req.body;
      if (!participant || !participant.address) {
        return failure(res, "Participant data is required", 400);
      }

      const trade = await TradeService.addParticipant(id, participant);
      return success(res, trade, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to add participant", 500);
    }
  }

  /**
   * PATCH /trades/:id/role
   * Assign a role to a participant in a trade.
   *
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async assignRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { address, role } = req.body;
      if (!id) return failure(res, "Missing trade id parameter", 422);
      if (!address || !role) return failure(res, "Participant address and role are required", 400);

      const participants = await TradeService.assignRole(id, address, role);
      return success(res, participants, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to assign role", 500);
    }
  }

  /**
   * PATCH /trades/:id/status
   * Update the status of a trade.
   *
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id) return failure(res, "Missing trade id parameter", 422);
      if (!status) return failure(res, "Status is required", 400);

      const trade = await TradeService.updateStatus(id, status);
      return success(res, trade, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to update trade status", 500);
    }
  }

  /**
   * GET /trades/my
   * Fetch all trades for the current authenticated user.
   *
   * @param {AuthRequest} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  static async getMyTrades(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.address) return failure(res, "Missing or invalid Authorization header", 401);

      const trades = await TradeService.getTradesByParticipant(user.address);
      if (!trades.length) return failure(res, "No trades found for user", 404);

      return success(res, trades, 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch user trades", 500);
    }
  }
}
