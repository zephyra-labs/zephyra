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
 * Utility: Handle unexpected errors (for catch blocks)
 * Automatically logs error and returns standardized failure
 */
export const handleError = (res: Response, err: any, message?: string, status = 500) => {
  console.error('❌ Error:', err)
  return failure(res, message || err.message || 'Internal Server Error', status)
}
