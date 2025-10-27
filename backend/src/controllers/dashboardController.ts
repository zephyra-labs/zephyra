import type { Request, Response } from "express"
import { DashboardService } from "../services/dashboardService.js"

export class DashboardController {
  /**
   * Get global admin dashboard
   * (aggregated overview of users, contracts, and documents)
   */
  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const dashboard = await DashboardService.getDashboard()
      return res.status(200).json({
        success: true,
        data: dashboard.toResponse(),
      })
    } catch (error) {
      console.error("Error fetching admin dashboard:", error)
      const message = error instanceof Error ? error.message : "Internal server error"
      return res.status(500).json({ success: false, message })
    }
  }

  /**
   * Get dashboard data for the authenticated user
   */
  static async getUserDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const userAddress = (req as any).user?.address
      if (!userAddress) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: missing user address",
        })
      }

      const dashboard = await DashboardService.getUserDashboard(userAddress)
      return res.status(200).json({
        success: true,
        data: dashboard.toResponse(),
      })
    } catch (error) {
      console.error("Error fetching user dashboard:", error)
      const message = error instanceof Error ? error.message : "Internal server error"
      return res.status(500).json({ success: false, message })
    }
  }
}
