/**
 * @file aggregatedActivityController.ts
 * @description Express controller for managing aggregated activity logs.
 * Supports CRUD operations, tagging, and filtering for aggregated activities.
 */

import type { Request, Response } from 'express'
import aggregatedActivityModel from '../models/aggregatedActivityModel.js'
import type { AggregatedActivityLog } from '../types/AggregatedActivity.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

/**
 * Create a new aggregated activity log.
 *
 * @route POST /aggregated-activity
 * @param {Request} req - Express request object, expects `account` in body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with created log or error.
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
 * Get an aggregated activity log by ID.
 *
 * @route GET /aggregated-activity/:id
 * @param {Request} req - Express request object, expects `id` param.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with the log or 404 error.
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
 * Get aggregated activity logs with optional filtering.
 *
 * @route GET /aggregated-activity
 * @param {Request} req - Express request object, supports query parameters:
 *   - account: filter by account
 *   - txHash: filter by transaction hash
 *   - contractAddress: filter by contract address
 *   - tags: comma-separated tags
 *   - limit: number of items to fetch (default 20)
 *   - startAfterTimestamp: pagination start
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response with filtered activity logs and pagination info.
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
 * Add a tag to an aggregated activity log.
 *
 * @route POST /aggregated-activity/:id/tag
 * @param {Request} req - Express request object, expects `id` param and `tag` in body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response confirming tag addition.
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
 * Remove a tag from an aggregated activity log.
 *
 * @route DELETE /aggregated-activity/:id/tag
 * @param {Request} req - Express request object, expects `id` param and `tag` query.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} JSON response confirming tag removal.
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
