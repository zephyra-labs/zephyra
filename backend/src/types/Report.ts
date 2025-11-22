/**
 * @file Report.ts
 * @description Types for reporting: main report, performance metrics, trade history, timelines, breakdowns.
 */

import { TradeRecord, TradeStatus } from "./Trade";

/* -------------------------------------------------------------------------- */
/*                               Helper Types                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generic breakdown item for grouping report data.
 */
export interface BreakdownItem {
  /** Label for the group (status, type, owner, etc.) */
  label: string;

  /** Total count for that label */
  count: number;
}

/**
 * Time-series representation for charts and timelines.
 * timestamp uses full precision (date + time).
 */
export interface TimeSeriesPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;

  /** Count for simple timelines (optional) */
  count?: number;

  /** Created count (for performance timelines) */
  createdCount?: number;

  /** Completed count (for performance timelines) */
  completedCount?: number;
}

/* -------------------------------------------------------------------------- */
/*                            Main Report (Dashboard)                          */
/* -------------------------------------------------------------------------- */

export interface MainReportResponse {
  stats: {
    totalTrades: number;
    totalDocuments: number;
    totalWallets: number;
    totalContracts: number;
    totalKYC?: number;
  };

  trades: {
    byStatus: BreakdownItem[];
    byUser: BreakdownItem[];
    timeline: TimeSeriesPoint[];
  };

  documents: {
    byStatus: BreakdownItem[];
    byType: BreakdownItem[];
    timeline: TimeSeriesPoint[];
  };

  contracts: {
    byOwner: BreakdownItem[];
    timeline: TimeSeriesPoint[];
  };

  wallets: {
    timeline: TimeSeriesPoint[];
  };

  activities: {
    byType: BreakdownItem[];
    timeline: TimeSeriesPoint[];
  };
}

/* -------------------------------------------------------------------------- */
/*                              Trade History                                 */
/* -------------------------------------------------------------------------- */

export interface TradeHistoryQuery {
  page?: number;
  limit?: number;
  from?: number;        // timestamp
  to?: number;          // timestamp
  status?: TradeStatus;
  user?: string;        // participant address
}

export interface TradeHistoryResponse {
  items: TradeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                              Performance Report                             */
/* -------------------------------------------------------------------------- */

export interface PerformanceReport {
  totals: {
    totalTrades: number;
    completedTrades: number;
    cancelledTrades: number;
  };

  metrics: {
    /** Average time to complete a trade, in ms (null if none completed) */
    averageCompletionTimeMs: number | null;

    /** Average time between stages (if multi-stage trade system is used) */
    averageUpdateIntervalMs: number | null;

    /** Average number of stages for all trades */
    averageStagesPerTrade: number | null;
  };

  participants: {
    /** Top users ranked by involvement in trades */
    topUsers: {
      address: string;
      tradeCount: number;
    }[];
  };

  /**
   * Timeline of created vs completed trades.
   * timestamp uses full date + time granularity.
   */
  timeline: {
    timestamp: number;
    createdCount: number;
    completedCount: number;
  }[];
}
