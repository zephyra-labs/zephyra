import { Request, Response } from 'express'
import aggregatedActivityModel from '../models/aggregatedActivityModel.js'
import type { AggregatedActivityLog } from '../types/AggregatedActivity.js'

export const addAggregatedActivity = async (req: Request, res: Response) => {
  try {
    const data: Partial<AggregatedActivityLog> = req.body
    const log = await aggregatedActivityModel.add(data)
    res.status(201).json(log)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getAggregatedActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const log = await aggregatedActivityModel.getById(id)
    if (!log) return res.status(404).json({ error: 'Log not found' })
    res.json(log)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

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
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const addAggregatedTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tag } = req.body
    if (!tag || typeof tag !== 'string') return res.status(400).json({ error: 'Tag required' })

    await aggregatedActivityModel.addTag(id, tag)
    res.json({ success: true, tag })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const removeAggregatedTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tag = req.query.tag as string
    if (!tag || typeof tag !== 'string') return res.status(400).json({ error: 'Tag required' })

    await aggregatedActivityModel.removeTag(id, tag)
    res.json({ success: true, tag })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
