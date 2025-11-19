/**
 * @file activityController.ts
 * @description Express controller for managing user activity logs.
 * Supports creating, listing, and fetching activities by account.
 */

import type { Request, Response } from 'express'
import { addActivityLog, getAllActivities, getActivityByAccount } from '../models/activityModel'
import { success, failure, handleError } from '../utils/responseHelper'

/**
 * Create a new activity log entry.
 *
 * @route POST /activity
 * @param {Request} req - Express request object, expects `account` in body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with created activity or error.
 */
export const createActivity = async (req: Request, res: Response) => {
  try {
    const payload = req.body
    // 400: missing payload
    if (!payload) return failure(res, 'Request body is required', 400)

    // 422: missing required field
    if (!payload.account) return failure(res, 'Missing required field: account', 422)
    if (!payload.action) return failure(res, 'Missing required field: action', 422)
    if (!payload.timestamp) payload.timestamp = Date.now()

    // Validate timestamp is a number
    if (isNaN(Number(payload.timestamp))) return failure(res, 'timestamp must be a number', 422)

    const entry = await addActivityLog(payload)
    return success(res, entry, 201)
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to create activity', 500)
  }
}

/**
 * Get activity logs with optional filtering.
 *
 * @route GET /activity
 * @param {Request} req - Express request object, supports query parameters:
 *   - account: filter by account
 *   - txHash: filter by transaction hash
 *   - limit: number of items to fetch
 *   - startAfterTimestamp: pagination start
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with filtered activity logs.
 */
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { account, txHash, limit, startAfterTimestamp } = req.query as {
      account?: string
      txHash?: string
      limit?: string
      startAfterTimestamp?: string
    }

    // 400: validate limit/startAfterTimestamp if provided
    if (limit && isNaN(Number(limit))) return failure(res, 'limit must be a number', 400)
    if (startAfterTimestamp && isNaN(Number(startAfterTimestamp)))
      return failure(res, 'startAfterTimestamp must be a number', 400)

    const logs = await getAllActivities({
      account,
      txHash,
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp ? parseInt(startAfterTimestamp) : undefined,
    })

    return success(res, {
      count: logs.length,
      items: logs,
    })
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to fetch activities', 500)
  }
}

/**
 * Get activity logs for a specific account.
 *
 * @route GET /activity/:account
 * @param {Request} req - Express request object, expects `account` param, optional query:
 *   - limit: number of items to fetch
 *   - startAfterTimestamp: pagination start
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with activity logs for the account.
 */
export const getActivityByAccountController = async (req: Request, res: Response) => {
  try {
    const { account } = req.params
    const { limit, startAfterTimestamp } = req.query as {
      limit?: string
      startAfterTimestamp?: string
    }

    // 400: missing or invalid account
    if (!account) return failure(res, 'Account parameter is required', 400)

    // 400: validate query params
    if (limit && isNaN(Number(limit))) return failure(res, 'limit must be a number', 400)
    if (startAfterTimestamp && isNaN(Number(startAfterTimestamp)))
      return failure(res, 'startAfterTimestamp must be a number', 400)

    const logs = await getActivityByAccount(account, {
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp ? parseInt(startAfterTimestamp) : undefined,
    })

    return success(res, {
      account,
      count: logs.length,
      items: logs,
    })
  } catch (err: unknown) {
    return handleError(res, err, 'Failed to fetch activities for this account', 500)
  }
}
