/**
 * @file dashboardController.ts
 * @description Express controller for dashboard endpoints.
 * Provides aggregated admin dashboard and user-specific dashboard data.
 */

import type { Response } from "express"
import { DashboardService } from "../services/dashboardService"
import type { AuthRequest } from "../middlewares/authMiddleware"
import { success, failure, handleError } from "../utils/responseHelper"

export class DashboardController {
  /**
   * Retrieves aggregated dashboard overview for admin.
   *
   * @route GET /dashboard
   * @param {AuthRequest} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with dashboard data or error.
   */
  static async getDashboard(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (req.query.limit && isNaN(Number(req.query.limit))) {
        return failure(res, "Limit must be a number", 422);
      }

      const dashboard = await DashboardService.getDashboard();

      if (!dashboard) {
        return failure(res, "Dashboard data not found", 404);
      }

      return success(res, dashboard.toResponse(), 200);
    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch admin dashboard", 500);
    }
  }

  /**
   * Retrieves dashboard data for the authenticated user.
   *
   * @route GET /dashboard/user
   * @param {AuthRequest} req - Express request object (requires authenticated user).
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with user dashboard data or error.
   */
  static async getUserDashboard(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userAddress = req.user?.address;

      if (!userAddress) {
        return failure(res, "Unauthorized: missing user address", 401);
      }

      if (typeof userAddress !== "string" || !userAddress.startsWith("0x") || userAddress.length < 10) {
        return failure(res, "Invalid wallet address format", 422);
      }

      const dashboard = await DashboardService.getUserDashboard(userAddress);

      if (!dashboard) {
        return failure(res, "User dashboard data not found", 404);
      }

      return success(res, dashboard.toResponse(), 200);

    } catch (err: unknown) {
      return handleError(res, err, "Failed to fetch user dashboard", 500);
    }
  }
}
