import type { Request, Response } from "express"
import { DashboardService } from "../services/dashboardService.js"
import { success, failure, handleError } from "../utils/responseHelper.js"

export class DashboardController {
  /**
   * GET /dashboard (Admin)
   * Aggregated overview of users, contracts, and documents
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
   * GET /dashboard/user
   * Dashboard data for the authenticated user
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
