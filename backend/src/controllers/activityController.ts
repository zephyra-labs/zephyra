import type { Request, Response } from 'express'
import { addActivityLog, getAllActivities, getActivityByAccount } from '../models/activityModel.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

/**
 * POST /activity
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
 * GET /activity
 * Optional query: ?account=0x123&txHash=0xabc&limit=20&startAfterTimestamp=1670000000000
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
 * GET /activity/:account
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
