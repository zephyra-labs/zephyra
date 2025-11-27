/**
 * @file reportDTO.ts
 * @description DTOs for Report endpoints: Main report, Trade history, Performance metrics.
 */

import type {
  MainReportResponse,
  TradeHistoryResponse,
  PerformanceReport,
  BreakdownItem,
  TimeSeriesPoint,
} from "../types/Report";
import type { TradeRecord } from "../types/Trade";

/* -------------------------------------------------------------------------- */
/*                          Main Report DTO                                   */
/* -------------------------------------------------------------------------- */

export class MainReportDTO {
  stats!: MainReportResponse["stats"];
  trades!: MainReportResponse["trades"];
  documents!: MainReportResponse["documents"];
  contracts!: MainReportResponse["contracts"];
  wallets!: MainReportResponse["wallets"];
  activities!: MainReportResponse["activities"];

  constructor(data: Partial<MainReportResponse>) {
    Object.assign(this, data);
  }

  validate(): void {
    if (!this.stats) throw new Error("MainReport stats is required");
    if (!this.trades) throw new Error("MainReport trades is required");
    if (!this.documents) throw new Error("MainReport documents is required");
    if (!this.contracts) throw new Error("MainReport contracts is required");
    if (!this.wallets) throw new Error("MainReport wallets is required");
    if (!this.activities) throw new Error("MainReport activities is required");
  }

  /**
   * Transform DTO to plain object for response
   */
  toResponse(): MainReportResponse {
    return {
      stats: this.stats,
      trades: this.trades,
      documents: this.documents,
      contracts: this.contracts,
      wallets: this.wallets,
      activities: this.activities,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                         Trade History DTO                                  */
/* -------------------------------------------------------------------------- */

export class TradeHistoryDTO {
  items: TradeRecord[] = [];
  pagination!: TradeHistoryResponse["pagination"];

  constructor(data: Partial<TradeHistoryResponse>) {
    Object.assign(this, data);
  }

  validate(): void {
    if (!Array.isArray(this.items)) throw new Error("TradeHistory items must be an array");
    if (!this.pagination) throw new Error("TradeHistory pagination is required");
  }

  toResponse(): TradeHistoryResponse {
    return {
      items: this.items,
      pagination: this.pagination,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                         Performance DTO                                    */
/* -------------------------------------------------------------------------- */

export class PerformanceReportDTO {
  totals!: PerformanceReport["totals"];
  metrics!: PerformanceReport["metrics"];
  participants!: PerformanceReport["participants"];
  timeline!: PerformanceReport["timeline"];

  constructor(data: Partial<PerformanceReport>) {
    Object.assign(this, data);
  }

  validate(): void {
    if (!this.totals) throw new Error("Performance totals is required");
    if (!this.metrics) throw new Error("Performance metrics is required");
    if (!this.participants) throw new Error("Performance participants is required");
    if (!this.timeline) throw new Error("Performance timeline is required");
  }

  toResponse(): PerformanceReport {
    return {
      totals: this.totals,
      metrics: this.metrics,
      participants: this.participants,
      timeline: this.timeline,
    };
  }
}
