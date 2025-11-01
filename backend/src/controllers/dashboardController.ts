/**
 * @file dashboardController.ts
 * @description Express controller for dashboard endpoints.
 * Provides aggregated admin dashboard and user-specific dashboard data.
 */

import type { Request, Response } from "express"
import { DashboardService } from "../services/dashboardService.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

export class DashboardController {
  /**
   * Retrieves aggregated dashboard overview for admin.
   *
   * @route GET /dashboard
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with dashboard data or error.
   */
  static async getDashboard(_req: Request, res: Response): Promise<Response> {
    try {
      const dashboard = await DashboardService.getDashboard()
      return success(res, dashboard.toResponse())
    } catch (err) {
      return handleError(res, err, "Failed to fetch admin dashboard")
    }
  }

  /**
   * Retrieves dashboard data for the authenticated user.
   *
   * @route GET /dashboard/user
   * @param {Request} req - Express request object (requires authenticated user).
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} JSON response with user dashboard data or error.
   */
  static async getUserDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) {
        return failure(res, "Unauthorized: missing user address", 401)
      }

      const dashboard = await DashboardService.getUserDashboard(userAddress)
      return success(res, dashboard.toResponse())
    } catch (err) {
      return handleError(res, err, "Failed to fetch user dashboard")
    }
  }
}
