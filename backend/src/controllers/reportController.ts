/**
 * @file reportController.ts
 * @description Express controller for reporting endpoints:
 * trade history, performance metrics, main report.
 */

import type { Request, Response } from "express";
import { ReportService } from "../services/reportService";
import { success, failure, handleError } from "../utils/responseHelper";

/**
 * Report Controller
 */
export class ReportController {
  /**
   * GET /reports/history
   * Trade history with pagination + filters
   */
  static async getTradeHistory(req: Request, res: Response) {
    try {
      const { page, limit, from, to, status, user } = req.query;

      const result = await ReportService.getTradeHistory({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        from: from ? Number(from) : undefined,
        to: to ? Number(to) : undefined,
        status: status ? (status as any) : undefined,
        user: user ? String(user) : undefined,
      });

      return success(res, result, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch trade history", 500);
    }
  }

  /**
   * GET /reports/performance
   * Aggregated performance metrics (completion time, stages, top users, timeline)
   */
  static async getPerformanceReport(req: Request, res: Response) {
    try {
      const { from, to } = req.query;

      const result = await ReportService.getPerformanceMetrics(
        from ? Number(from) : undefined,
        to ? Number(to) : undefined
      );

      return success(res, result, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch performance report", 500);
    }
  }

  /**
   * GET /reports/main
   * Main aggregated dashboard report
   */
  static async getMainReport(req: Request, res: Response) {
    try {
      const { from, to } = req.query;

      const result = await ReportService.getMainReport(
        from ? Number(from) : undefined,
        to ? Number(to) : undefined
      );

      return success(res, result, 200);
    } catch (err) {
      return handleError(res, err, "Failed to fetch main report", 500);
    }
  }
}
