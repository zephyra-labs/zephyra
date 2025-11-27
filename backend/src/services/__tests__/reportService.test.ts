/**
 * @file reportService.test.ts
 * @description Unit tests for ReportService with mocked ReportModel
 */

import { ReportService } from "../reportService";
import { ReportModel } from "../../models/reportModel";

// Mock ReportModel
jest.mock("../../models/reportModel");

describe("ReportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /*                            getTradeHistory                                 */
  /* -------------------------------------------------------------------------- */
  describe("getTradeHistory", () => {
    it("should return transformed trade history", async () => {
      const mockTrades = [
        {
          id: "t1",
          status: "draft",
          participants: [{ address: "u1" }],
          currentStage: 1,
          createdAt: 100,
          updatedAt: 200,
        },
      ];

      (ReportModel.getTradeHistory as jest.Mock).mockResolvedValue({
        trades: mockTrades,
        total: 1,
      });

      const result = await ReportService.getTradeHistory({ page: 1, limit: 10 });

      expect(ReportModel.getTradeHistory).toHaveBeenCalledWith({ page: 1, limit: 10 });

      expect(result).toEqual({
        trades: [
          {
            id: "t1",
            status: "draft",
            participants: [{ address: "u1" }],
            currentStage: 1,
            createdAt: 100,
            updatedAt: 200,
          },
        ],
        total: 1,
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                          getPerformanceMetrics                              */
  /* -------------------------------------------------------------------------- */
  describe("getPerformanceMetrics", () => {
    it("should return transformed performance metrics", async () => {
      const mockPerformance = {
        totals: { totalTrades: 5 },
        metrics: { averageCompletionTimeMs: 1000 },
        participants: { topUsers: [] },
        timeline: [
          { timestamp: 10, createdCount: 1, completedCount: 0 },
        ],
      };

      (ReportModel.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockPerformance);

      const result = await ReportService.getPerformanceMetrics(0, 100);

      expect(ReportModel.getPerformanceMetrics).toHaveBeenCalledWith(0, 100);

      expect(result).toEqual({
        totals: { totalTrades: 5 },
        metrics: { averageCompletionTimeMs: 1000 },
        participants: { topUsers: [] },
        timeline: [
          { timestamp: 10, createdCount: 1, completedCount: 0 },
        ],
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                             getMainReport                                   */
  /* -------------------------------------------------------------------------- */
  describe("getMainReport", () => {
    it("should return transformed main report", async () => {
      const mockMainReport = {
        stats: { totalTrades: 10 },
        trades: {
          byStatus: [{ label: "draft", value: 5 }],
          byUser: [{ label: "u1", value: 2 }],
          timeline: [{ timestamp: 10, createdCount: 1, completedCount: 0 }],
        },
        documents: { byStatus: [], byType: [], timeline: [] },
        contracts: { byOwner: [], timeline: [] },
        wallets: { timeline: [] },
        activities: { byType: [], timeline: [] },
      };

      (ReportModel.getMainReport as jest.Mock).mockResolvedValue(mockMainReport);

      const result = await ReportService.getMainReport(0, 100);

      expect(ReportModel.getMainReport).toHaveBeenCalledWith(0, 100);

      expect(result).toEqual({
        stats: mockMainReport.stats,
        trades: {
          byStatus: mockMainReport.trades.byStatus,
          byUser: mockMainReport.trades.byUser,
          timeline: mockMainReport.trades.timeline,
        },
        documents: mockMainReport.documents,
        contracts: mockMainReport.contracts,
        wallets: mockMainReport.wallets,
        activities: mockMainReport.activities,
      });
    });
  });
});
