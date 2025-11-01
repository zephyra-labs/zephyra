/**
 * @file responseHelper.ts
 * @description Standardized helpers for Express API responses: success, failure, and error handling.
 */

import type { Response } from 'express'

/**
 * Send a standardized success response
 * @param res Express response
 * @param data Any payload
 * @param status Optional HTTP status (default: 200)
 */
export const success = (res: Response, data: any, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  })
}

/**
 * Send a standardized failure response
 * @param res Express response
 * @param message Error message
 * @param status Optional HTTP status (default: 400)
 */
export const failure = (res: Response, message: string, status = 400) => {
  return res.status(status).json({
    success: false,
    message,
  })
}

/**
 * Handle unexpected errors (for catch blocks)
 * Logs the error and returns a standardized failure response
 * @param res Express response
 * @param err The caught error
 * @param message Optional custom message
 * @param status Optional HTTP status (default: 500)
 */
export const handleError = (res: Response, err: unknown, message?: string, status = 500) => {
  console.error('❌ Error:', err)
  return failure(res, message || (err instanceof Error ? err.message : 'Internal Server Error'), status)
}
