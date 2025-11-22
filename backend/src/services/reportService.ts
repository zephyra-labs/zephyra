/**
 * @file reportService.ts
 * @description Business logic layer for reporting endpoints.
 * Handles trade history, performance metrics, and main aggregated report.
 */

import { ReportModel } from "../models/reportModel";
import type { TradeStatus } from "../types/Trade";
import type { BreakdownItem, TimeSeriesPoint } from "../types/Report";

export class ReportService {
  /**
   * Get trade history with filters and pagination
   */
  static async getTradeHistory(params: {
    page?: number;
    limit?: number;
    from?: number;
    to?: number;
    status?: TradeStatus;
    user?: string;
  }): Promise<{ trades: any[]; total: number }> {
    const { trades, total } = await ReportModel.getTradeHistory(params);

    // Transform to DTO if needed (simplified here)
    const tradeDTOs = trades.map((t) => ({
      id: t.id,
      status: t.status,
      participants: t.participants,
      currentStage: t.currentStage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { trades: tradeDTOs, total };
  }

  /**
   * Get aggregated performance metrics for trades
   */
  static async getPerformanceMetrics(from?: number, to?: number) {
    const performance = await ReportModel.getPerformanceMetrics(from, to);

    // Optional: Transform timeline if needed
    const timeline: TimeSeriesPoint[] = performance.timeline.map((t) => ({
      timestamp: t.timestamp,
      createdCount: t.createdCount,
      completedCount: t.completedCount,
    }));

    return {
      totals: performance.totals,
      metrics: performance.metrics,
      participants: performance.participants,
      timeline,
    };
  }

  /**
   * Get main report aggregated stats
   */
  static async getMainReport(from?: number, to?: number) {
    const mainReport = await ReportModel.getMainReport(from, to);

    // Optionally: transform breakdown items if needed
    const tradesBreakdown: { byStatus: BreakdownItem[]; byUser: BreakdownItem[] } = {
      byStatus: mainReport.trades.byStatus,
      byUser: mainReport.trades.byUser,
    };

    const tradeTimeline: TimeSeriesPoint[] = mainReport.trades.timeline;

    return {
      stats: mainReport.stats,
      trades: {
        byStatus: tradesBreakdown.byStatus,
        byUser: tradesBreakdown.byUser,
        timeline: tradeTimeline,
      },
      documents: mainReport.documents,
      contracts: mainReport.contracts,
      wallets: mainReport.wallets,
      activities: mainReport.activities,
    };
  }
}
