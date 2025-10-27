import { Request, Response, NextFunction } from "express"

/**
 * Middleware for internal service authentication.
 * Used for secure communication between microservices (e.g., KYC ↔ TradeChain).
 */
export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const internalKey = req.header("x-internal-key")
    const validKey = process.env.INTERNAL_API_KEY

    if (!validKey) {
      console.error("⚠️ INTERNAL_API_KEY is not set in environment variables")
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error",
      })
    }

    if (!internalKey || internalKey !== validKey) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized internal access",
      })
    }

    next()
  } catch (error) {
    console.error("❌ Internal Auth Middleware Error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal authentication failed",
    })
  }
}
