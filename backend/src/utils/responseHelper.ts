/**
 * @file responseHelper.ts
 * @description Standardized helpers for Express API responses: success, failure, and error handling.
 */

import type { Response } from 'express'

/**
 * Send a standardized success response
 * @template T - Type of the payload
 * @param res Express response
 * @param data Payload of type T
 * @param status Optional HTTP status (default: 200)
 */
export const success = <T>(res: Response, data: T, status = 200): Response => {
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
export const failure = (res: Response, message: string, status = 400): Response => {
  return res.status(status).json({
    success: false,
    message,
  })
}

/**
 * Handle unexpected errors (for catch blocks)
 * Logs the error and returns a standardized failure response
 * @param res Express response
 * @param err The caught error (unknown type)
 * @param message Optional custom message
 * @param status Optional HTTP status (default: 500)
 */
export const handleError = (
  res: Response,
  err: unknown,
  message?: string,
  status = 500
): Response => {
  console.error('❌ Error:', err)
  const errorMessage =
    message || (err instanceof Error ? err.message : 'Internal Server Error')
  return failure(res, errorMessage, status)
}
