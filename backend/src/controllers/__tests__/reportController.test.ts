import { ReportController } from "../reportController";
import { ReportService } from "../../services/reportService";
import { success, handleError } from "../../utils/responseHelper";

jest.mock("../../services/reportService");
jest.mock("../../utils/responseHelper");

describe("ReportController", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // GET /reports/history
  // -------------------------------------------------------
  describe("getTradeHistory", () => {
    it("should call ReportService.getTradeHistory with parsed params", async () => {
      req.query = {
        page: "2",
        limit: "20",
        from: "1000",
        to: "2000",
        status: "completed",
        user: "0x123",
      };

      (ReportService.getTradeHistory as jest.Mock).mockResolvedValue({
        trades: [],
        total: 0,
      });

      await ReportController.getTradeHistory(req, res);

      expect(ReportService.getTradeHistory).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        from: 1000,
        to: 2000,
        status: "completed",
        user: "0x123",
      });

      expect(success).toHaveBeenCalledWith(res, { trades: [], total: 0 }, 200);
    });

    it("should handle error", async () => {
      const err = new Error("DB failure");
      (ReportService.getTradeHistory as jest.Mock).mockRejectedValue(err);

      await ReportController.getTradeHistory(req, res);

      expect(handleError).toHaveBeenCalledWith(
        res,
        err,
        "Failed to fetch trade history",
        500
      );
    });
  });

  // -------------------------------------------------------
  // GET /reports/performance
  // -------------------------------------------------------
  describe("getPerformanceReport", () => {
    it("should call ReportService.getPerformanceMetrics", async () => {
      req.query = { from: "100", to: "200" };

      const mockResponse = { totals: {}, metrics: {}, participants: [], timeline: [] };
      (ReportService.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockResponse);

      await ReportController.getPerformanceReport(req, res);

      expect(ReportService.getPerformanceMetrics).toHaveBeenCalledWith(100, 200);
      expect(success).toHaveBeenCalledWith(res, mockResponse, 200);
    });

    it("should handle error", async () => {
      const err = new Error("Performance error");
      (ReportService.getPerformanceMetrics as jest.Mock).mockRejectedValue(err);

      await ReportController.getPerformanceReport(req, res);

      expect(handleError).toHaveBeenCalledWith(
        res,
        err,
        "Failed to fetch performance report",
        500
      );
    });
  });

  // -------------------------------------------------------
  // GET /reports/main
  // -------------------------------------------------------
  describe("getMainReport", () => {
    it("should call ReportService.getMainReport with parsed dates", async () => {
      req.query = { from: "500", to: "900" };

      const mockValue = { stats: {}, trades: {}, documents: {}, contracts: {} };
      (ReportService.getMainReport as jest.Mock).mockResolvedValue(mockValue);

      await ReportController.getMainReport(req, res);

      expect(ReportService.getMainReport).toHaveBeenCalledWith(500, 900);
      expect(success).toHaveBeenCalledWith(res, mockValue, 200);
    });

    it("should handle error", async () => {
      const err = new Error("Main Report Error");
      (ReportService.getMainReport as jest.Mock).mockRejectedValue(err);

      await ReportController.getMainReport(req, res);

      expect(handleError).toHaveBeenCalledWith(
        res,
        err,
        "Failed to fetch main report",
        500
      );
    });
  });
});
