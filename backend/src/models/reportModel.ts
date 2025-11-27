/**
 * @file reportModel.ts
 * @description Firestore model for reporting endpoints: main report, performance metrics, trade history.
 */

import { db } from "../config/firebase";
import type { TradeRecord, TradeStatus } from "../types/Trade";
import type { TimeSeriesPoint, BreakdownItem } from "../types/Report";
import { TradeModel } from "./tradeModel";

/** Collection references */
const documentCollection = db.collection("documents");
const contractCollection = db.collection("contracts");
const walletCollection = db.collection("wallets");
const activityCollection = db.collection("activities");

/* -------------------------------------------------------------------------- */
/*                              Report Model                                   */
/* -------------------------------------------------------------------------- */
export class ReportModel {
  /**
   * Retrieve trade records with optional filters and pagination using TradeModel.
   */
  static async getTradeHistory(params: {
    page?: number;
    limit?: number;
    from?: number;
    to?: number;
    status?: TradeStatus;
    user?: string;
  }): Promise<{ trades: TradeRecord[]; total: number }> {
    // Ambil semua trade via TradeModel
    let trades = await TradeModel.getAllTrades();

    // Filter by status
    if (params.status) trades = trades.filter((t) => t.status === params.status);

    // Filter by date range safely
    const from = params.from;
    const to = params.to;

    if (typeof from === "number") trades = trades.filter((t) => t.createdAt >= from);
    if (typeof to === "number") trades = trades.filter((t) => t.createdAt <= to);

    // Filter by participant
    if (params.user) trades = trades.filter((t) => t.participants.some((p) => p.address === params.user));

    const total = trades.length;

    // Pagination
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    trades = trades.slice(start, start + limit);

    return { trades, total };
  }

  /**
   * Generate breakdown items for trades.
   */
  static generateTradeBreakdowns(trades: TradeRecord[]): { byStatus: BreakdownItem[]; byUser: BreakdownItem[] } {
    // Breakdown by status
    const statuses: TradeStatus[] = ["draft", "readyToTrade", "inProgress", "completed", "cancelled"];
    const byStatus: BreakdownItem[] = statuses.map((status) => ({
      label: status,
      count: trades.filter((t) => t.status === status).length,
    }));

    // Breakdown by participant
    const participantMap: Record<string, number> = {};
    trades.forEach((t) => {
      t.participants.forEach((p) => {
        participantMap[p.address] = (participantMap[p.address] ?? 0) + 1;
      });
    });
    const byUser: BreakdownItem[] = Object.entries(participantMap).map(([label, count]) => ({ label, count }));

    return { byStatus, byUser };
  }

  /**
   * Generate timeline for trades (created and completed).
   */
  static generateTradeTimeline(trades: TradeRecord[]): TimeSeriesPoint[] {
    return trades.map((t) => ({
      timestamp: t.createdAt,
      count: 1,
    }));
  }

  /**
   * Generate aggregated performance metrics from trades.
   */
  static async getPerformanceMetrics(from?: number, to?: number) {
    const { trades } = await this.getTradeHistory({ from, to });

    const completedTrades = trades.filter((t) => t.status === "completed");
    const cancelledTrades = trades.filter((t) => t.status === "cancelled");

    // Average completion time (ms)
    const averageCompletionTimeMs =
      completedTrades.length > 0
        ? completedTrades.reduce((sum, t) => sum + ((t.updatedAt ?? Date.now()) - t.createdAt), 0) /
          completedTrades.length
        : null;

    // Average stages per trade
    const averageStagesPerTrade =
      trades.length > 0
        ? trades.reduce((sum, t) => sum + (t.currentStage ?? 1), 0) / trades.length
        : null;

    // Top participants
    const participantMap: Record<string, number> = {};
    trades.forEach((t) => {
      t.participants.forEach((p) => {
        participantMap[p.address] = (participantMap[p.address] ?? 0) + 1;
      });
    });
    const topUsers = Object.entries(participantMap)
      .map(([address, tradeCount]) => ({ address, tradeCount }))
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 10);

    // Timeline
    const timeline = trades.map((t) => ({
      timestamp: t.createdAt,
      createdCount: 1,
      completedCount: t.status === "completed" ? 1 : 0,
    }));

    return {
      totals: {
        totalTrades: trades.length,
        completedTrades: completedTrades.length,
        cancelledTrades: cancelledTrades.length,
      },
      metrics: {
        averageCompletionTimeMs,
        averageUpdateIntervalMs: null,
        averageStagesPerTrade,
      },
      participants: {
        topUsers,
      },
      timeline,
    };
  }

  /**
   * Count and breakdown for main report (aggregated stats)
   */
  static async getMainReport(from?: number, to?: number) {
    const [tradeData, documentSnapshot, contractSnapshot, walletSnapshot, activitySnapshot] = await Promise.all([
      TradeModel.getAllTrades(),
      documentCollection.get(),
      contractCollection.get(),
      walletCollection.get(),
      activityCollection.get(),
    ]);

    const totalTrades = tradeData.length;
    const totalDocuments = documentSnapshot.size;
    const totalContracts = contractSnapshot.size;
    const totalWallets = walletSnapshot.size;
    const totalKYC = 0; // jika KYC collection ada, ganti dengan count

    const { byStatus, byUser } = this.generateTradeBreakdowns(tradeData);
    const timeline = this.generateTradeTimeline(tradeData);

    return {
      stats: {
        totalTrades,
        totalDocuments,
        totalContracts,
        totalWallets,
        totalKYC,
      },
      trades: {
        byStatus,
        byUser,
        timeline,
      },
      documents: {
        byStatus: [],
        byType: [],
        timeline: [],
      },
      contracts: {
        byOwner: [],
        timeline: [],
      },
      wallets: {
        timeline: [],
      },
      activities: {
        byType: [],
        timeline: [],
      },
    };
  }
}
