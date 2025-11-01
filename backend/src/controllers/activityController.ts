/**
 * @file activityController.ts
 * @description Express controller for managing user activity logs.
 * Supports creating, listing, and fetching activities by account.
 */

import type { Request, Response } from 'express'
import { addActivityLog, getAllActivities, getActivityByAccount } from '../models/activityModel.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

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
    if (!payload || !payload.account) {
      return failure(res, 'Missing required field: account')
    }

    const entry = await addActivityLog(payload)
    return success(res, entry, 201)
  } catch (err: any) {
    return handleError(res, err, 'Failed to create activity', 400)
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

    const logs = await getAllActivities({
      account,
      txHash,
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp
        ? parseInt(startAfterTimestamp)
        : undefined,
    })

    return success(res, {
      count: logs.length,
      items: logs,
    })
  } catch (err: any) {
    return handleError(res, err, 'Failed to fetch activities')
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

    const logs = await getActivityByAccount(account, {
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp
        ? parseInt(startAfterTimestamp)
        : undefined,
    })

    return success(res, {
      account,
      count: logs?.length || 0,
      items: logs || [],
    })
  } catch (err: any) {
    return handleError(res, err, 'Failed to fetch activities for this account')
  }
}
