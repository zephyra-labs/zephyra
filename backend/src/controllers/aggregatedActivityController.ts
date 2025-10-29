import type { Request, Response } from 'express'
import aggregatedActivityModel from '../models/aggregatedActivityModel.js'
import type { AggregatedActivityLog } from '../types/AggregatedActivity.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

/**
 * POST /aggregated-activity
 */
export const addAggregatedActivity = async (req: Request, res: Response) => {
  try {
    const data: Partial<AggregatedActivityLog> = req.body

    if (!data || !data.account) {
      return failure(res, 'Missing required field: account')
    }

    const log = await aggregatedActivityModel.add(data)
    return success(res, log, 201)
  } catch (err: any) {
    return handleError(res, err, 'Failed to create aggregated activity', 400)
  }
}

/**
 * GET /aggregated-activity/:id
 */
export const getAggregatedActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) return failure(res, 'Missing ID parameter')

    const log = await aggregatedActivityModel.getById(id)
    if (!log) return failure(res, 'Log not found', 404)

    return success(res, log)
  } catch (err: any) {
    return handleError(res, err, 'Failed to fetch aggregated activity')
  }
}

/**
 * GET /aggregated-activity
 * Optional query:
 * ?account=0x123&txHash=0xabc&contractAddress=0xdef&tags=trade,settlement&limit=20&startAfterTimestamp=1670000000000
 */
export const getAggregatedActivities = async (req: Request, res: Response) => {
  try {
    const filter = {
      account: req.query.account as string | undefined,
      txHash: req.query.txHash as string | undefined,
      contractAddress: req.query.contractAddress as string | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      startAfterTimestamp: req.query.startAfterTimestamp
        ? parseInt(req.query.startAfterTimestamp as string)
        : undefined,
    }

    const result = await aggregatedActivityModel.getAll(filter)

    return success(res, {
      count: result.data.length,
      items: result.data,
      nextStartAfterTimestamp: result.nextStartAfterTimestamp ?? null,
    })
  } catch (err: any) {
    return handleError(res, err, 'Failed to fetch aggregated activities')
  }
}

/**
 * POST /aggregated-activity/:id/tag
 */
export const addAggregatedTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tag } = req.body

    if (!id) return failure(res, 'Missing ID parameter')
    if (!tag || typeof tag !== 'string') return failure(res, 'Tag is required and must be a string')

    await aggregatedActivityModel.addTag(id, tag)
    return success(res, { tag, message: 'Tag added successfully' })
  } catch (err: any) {
    return handleError(res, err, 'Failed to add tag to aggregated activity')
  }
}

/**
 * DELETE /aggregated-activity/:id/tag?tag=example
 */
export const removeAggregatedTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tag = req.query.tag as string

    if (!id) return failure(res, 'Missing ID parameter')
    if (!tag || typeof tag !== 'string') return failure(res, 'Tag is required and must be a string')

    await aggregatedActivityModel.removeTag(id, tag)
    return success(res, { tag, message: 'Tag removed successfully' })
  } catch (err: any) {
    return handleError(res, err, 'Failed to remove tag from aggregated activity')
  }
}
