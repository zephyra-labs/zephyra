/**
 * @file reportModel.test.ts
 * @description Unit tests for ReportModel with mocked Firestore and TradeModel.
 */

import { ReportModel } from "../reportModel";
import type { TradeRecord, TradeStatus } from "../../types/Trade";

// --- Mock TradeModel
jest.mock("../tradeModel", () => ({
  TradeModel: {
    getAllTrades: jest.fn(),
  },
}));
import { TradeModel } from "../tradeModel";

// --- Mock Firestore
jest.mock("../../config/firebase", () => {
  const makeCollection = () => ({
    get: jest.fn(async () => ({ size: 0 })),
  });

  return {
    db: {
      collection: (name: string) => makeCollection(),
    },
  };
});

describe("ReportModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTradeHistory", () => {
    it("should filter trades by status, date range, user, and paginate", async () => {
      const now = Date.now();
      const trades: TradeRecord[] = [
        { id: "t1", status: "completed", createdAt: now - 1000, updatedAt: now, participants: [{ address: "0x1", kycVerified: true, walletConnected: true }] },
        { id: "t2", status: "draft", createdAt: now - 500, participants: [{ address: "0x2", kycVerified: true, walletConnected: true }] },
      ];
      (TradeModel.getAllTrades as jest.Mock).mockResolvedValue(trades);

      const result = await ReportModel.getTradeHistory({
        status: "completed",
        from: now - 2000,
        to: now,
        user: "0x1",
        page: 1,
        limit: 1,
      });

      expect(result.total).toBe(1);
      expect(result.trades[0].id).toBe("t1");
    });

    it("should return all trades if no filters applied", async () => {
      const trades: TradeRecord[] = [{ id: "t1", status: "draft", createdAt: 0, participants: [] }];
      (TradeModel.getAllTrades as jest.Mock).mockResolvedValue(trades);

      const result = await ReportModel.getTradeHistory({});
      expect(result.total).toBe(1);
      expect(result.trades[0].id).toBe("t1");
    });
  });

  describe("generateTradeBreakdowns", () => {
    it("should create breakdowns by status and by user", () => {
      const trades: TradeRecord[] = [
        { id: "t1", status: "draft", participants: [{ address: "u1", kycVerified: true, walletConnected: true }], createdAt: 0 },
        { id: "t2", status: "completed", participants: [{ address: "u1", kycVerified: true, walletConnected: true }, { address: "u2", kycVerified: true, walletConnected: true }], createdAt: 0 },
      ];

      const { byStatus, byUser } = ReportModel.generateTradeBreakdowns(trades);

      expect(byStatus.find(s => s.label === "draft")?.count).toBe(1);
      expect(byStatus.find(s => s.label === "completed")?.count).toBe(1);
      expect(byUser.find(u => u.label === "u1")?.count).toBe(2);
      expect(byUser.find(u => u.label === "u2")?.count).toBe(1);
    });
  });

  describe("generateTradeTimeline", () => {
    it("should map trades to timeline points", () => {
      const trades: TradeRecord[] = [{ id: "t1", createdAt: 123, participants: [], status: "draft" }];
      const timeline = ReportModel.generateTradeTimeline(trades);
      expect(timeline).toEqual([{ timestamp: 123, count: 1 }]);
    });
  });

  describe("getPerformanceMetrics", () => {
    it("should calculate averages and top participants", async () => {
      const now = Date.now();
      const trades: TradeRecord[] = [
        { id: "t1", status: "completed", createdAt: now - 1000, updatedAt: now, currentStage: 2, participants: [{ address: "u1", kycVerified: true, walletConnected: true }] },
        { id: "t2", status: "cancelled", createdAt: now - 500, participants: [{ address: "u2", kycVerified: true, walletConnected: true }] },
      ];
      (ReportModel.getTradeHistory as jest.Mock) = jest.fn().mockResolvedValue({ trades, total: trades.length });

      const metrics = await ReportModel.getPerformanceMetrics();

      expect(metrics.totals.totalTrades).toBe(2);
      expect(metrics.totals.completedTrades).toBe(1);
      expect(metrics.metrics.averageCompletionTimeMs).toBeCloseTo(1000);
      expect(metrics.participants.topUsers[0].address).toBe("u1");
    });
  });

  describe("getMainReport", () => {
    it("should return main report with counts and empty breakdowns", async () => {
      const trades: TradeRecord[] = [
        { id: "t1", status: "draft", createdAt: 0, participants: [] },
      ];
      (TradeModel.getAllTrades as jest.Mock).mockResolvedValue(trades);

      const report = await ReportModel.getMainReport();

      expect(report.stats.totalTrades).toBe(1);
      expect(report.trades.byStatus.find(s => s.label === "draft")?.count).toBe(1);
      expect(report.documents.byStatus).toEqual([]);
      expect(report.contracts.timeline).toEqual([]);
    });
  });
});
