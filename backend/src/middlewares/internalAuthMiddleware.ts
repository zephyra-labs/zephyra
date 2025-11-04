/**
 * @file internalAuthMiddleware.ts
 * @description Middleware to authenticate internal service requests using a shared secret key.
 * Ensures secure communication between microservices (e.g., KYC ↔ TradeChain).
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Internal Auth Middleware
 * Validates the `x-internal-key` header against the environment variable `INTERNAL_API_KEY`.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void|Response} 403 if key missing/invalid, 500 if server misconfigured
 */
export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const internalKey = req.header("x-internal-key");
    const validKey = process.env.INTERNAL_API_KEY;

    if (!validKey) {
      console.error("⚠️ INTERNAL_API_KEY is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error",
      });
    }

    if (!internalKey || internalKey !== validKey) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized internal access",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Internal Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication failed",
    });
  }
}
