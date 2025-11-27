/**
 * @file reportDTO.test.ts
 * @description Unit tests for MainReportDTO, TradeHistoryDTO, PerformanceReportDTO
 */

import {
  MainReportDTO,
  TradeHistoryDTO,
  PerformanceReportDTO,
} from "../reportDTO";

import type {
  MainReportResponse,
  TradeHistoryResponse,
  PerformanceReport,
} from "../../types/Report";

import type { TradeRecord } from "../../types/Trade";

/* -------------------------------------------------------------------------- */
/*                               MainReportDTO                                 */
/* -------------------------------------------------------------------------- */

describe("MainReportDTO", () => {
  const base: Partial<MainReportResponse> = {
    stats: { totalTrades: 10, totalDocuments: 5, totalContracts: 3, totalWallets: 4, totalKYC: 2 },
    trades: { byStatus: [], byUser: [], timeline: [] },
    documents: { byStatus: [], byType: [], timeline: [] },
    contracts: { byOwner: [], timeline: [] },
    wallets: { timeline: [] },
    activities: { byType: [], timeline: [] },
  };

  it("should construct with data and output response", () => {
    const dto = new MainReportDTO(base);
    expect(dto.stats!.totalTrades).toBe(10);
    expect(dto.toResponse()).toEqual(base);
  });

  // 🔥 Cover ALL 6 negative branches
  test("validate() should throw error when stats missing", () => {
    const dto = new MainReportDTO({ ...base, stats: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport stats is required");
  });

  test("validate() should throw error when trades missing", () => {
    const dto = new MainReportDTO({ ...base, trades: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport trades is required");
  });

  test("validate() should throw error when documents missing", () => {
    const dto = new MainReportDTO({ ...base, documents: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport documents is required");
  });

  test("validate() should throw error when contracts missing", () => {
    const dto = new MainReportDTO({ ...base, contracts: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport contracts is required");
  });

  test("validate() should throw error when wallets missing", () => {
    const dto = new MainReportDTO({ ...base, wallets: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport wallets is required");
  });

  test("validate() should throw error when activities missing", () => {
    const dto = new MainReportDTO({ ...base, activities: undefined as any });
    expect(() => dto.validate()).toThrow("MainReport activities is required");
  });
});

/* -------------------------------------------------------------------------- */
/*                              TradeHistoryDTO                                */
/* -------------------------------------------------------------------------- */

describe("TradeHistoryDTO", () => {
  const mockItems: TradeRecord[] = [
    {
      id: "t1",
      status: "draft",
      createdAt: 0,
      participants: [{ address: "u1", kycVerified: true, walletConnected: true }],
    },
  ];

  const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

  it("should construct and validate correctly", () => {
    const dto = new TradeHistoryDTO({ items: mockItems, pagination });
    dto.validate(); // should not throw
    expect(dto.items.length).toBe(1);
  });

  // 🔥 Covers error branch #1
  it("should throw error if items is not array", () => {
    // @ts-expect-error
    const dto = new TradeHistoryDTO({ items: null, pagination });
    expect(() => dto.validate()).toThrow("TradeHistory items must be an array");
  });

  // 🔥 Covers error branch #2
  it("should throw error if pagination is missing", () => {
    const dto = new TradeHistoryDTO({ items: mockItems });
    expect(() => dto.validate()).toThrow("TradeHistory pagination is required");
  });

  it("toResponse should return correct shape", () => {
    const dto = new TradeHistoryDTO({ items: mockItems, pagination });
    expect(dto.toResponse()).toEqual({ items: mockItems, pagination });
  });
});

/* -------------------------------------------------------------------------- */
/*                           PerformanceReportDTO                              */
/* -------------------------------------------------------------------------- */

describe("PerformanceReportDTO", () => {
  const base: Partial<PerformanceReport> = {
    totals: { totalTrades: 5, completedTrades: 3, cancelledTrades: 1 },
    metrics: { averageCompletionTimeMs: 1000, averageUpdateIntervalMs: 500, averageStagesPerTrade: 2 },
    participants: { topUsers: [{ address: "u1", tradeCount: 3 }] },
    timeline: [{ timestamp: 0, createdCount: 1, completedCount: 0 }],
  };

  it("should construct with data and output response", () => {
    const dto = new PerformanceReportDTO(base);
    expect(dto.totals.totalTrades).toBe(5);
    expect(dto.toResponse()).toEqual(base);
  });

  // 🔥 Cover ALL 4 negative branches
  test("validate() should throw when totals missing", () => {
    const dto = new PerformanceReportDTO({ ...base, totals: undefined as any });
    expect(() => dto.validate()).toThrow("Performance totals is required");
  });

  test("validate() should throw when metrics missing", () => {
    const dto = new PerformanceReportDTO({ ...base, metrics: undefined as any });
    expect(() => dto.validate()).toThrow("Performance metrics is required");
  });

  test("validate() should throw when participants missing", () => {
    const dto = new PerformanceReportDTO({ ...base, participants: undefined as any });
    expect(() => dto.validate()).toThrow("Performance participants is required");
  });

  test("validate() should throw when timeline missing", () => {
    const dto = new PerformanceReportDTO({ ...base, timeline: undefined as any });
    expect(() => dto.validate()).toThrow("Performance timeline is required");
  });
});
