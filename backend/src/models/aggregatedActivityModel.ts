/**
 * @file aggregatedActivityLogsModel.ts
 * @description Firestore model for managing aggregated activity logs with filtering, pagination, and tagging.
 */

import admin from 'firebase-admin'
import { db } from '../config/firebase'
import type { AggregatedActivityLog } from '../types/AggregatedActivity'
import ActivityLogDTO from '../dtos/activityDTO'

/** Firestore collection reference for aggregated activity logs */
const collection = db.collection('aggregatedActivityLogs')

export default {
  /**
   * Add a new aggregated activity log
   * @param data Partial data for creating a log
   * @returns The newly created AggregatedActivityLog
   */
  add: async (data: Partial<AggregatedActivityLog>): Promise<AggregatedActivityLog> => {
    const dto = new ActivityLogDTO(data)
    dto.validate()

    const entry: AggregatedActivityLog = {
      id: `${dto.account}_${dto.timestamp}`,
      timestamp: dto.timestamp ?? Date.now(),
      type: dto.type,
      action: dto.action,
      account: dto.account,
      accountLower: dto.account,
      txHash: dto.txHash,
      txHashLower: dto.txHash,
      contractAddress: dto.contractAddress,
      contractLower: dto.contractAddress,
      extra: dto.extra ?? undefined,
      onChainInfo: dto.onChainInfo,
      tags: [],
    }

    await collection.doc(entry.id).set(entry)
    return entry
  },

  /**
   * Get aggregated activity log by ID
   * @param id Log ID
   * @returns AggregatedActivityLog or null if not found
   */
  getById: async (id: string): Promise<AggregatedActivityLog | null> => {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    return doc.data() as AggregatedActivityLog
  },

  /**
   * Get all activity logs with optional filtering, pagination, and tags
   * @param filter Optional filtering parameters
   * @returns Object containing filtered data and next start timestamp for pagination
   */
  getAll: async (filter?: {
    account?: string
    txHash?: string
    contractAddress?: string
    tags?: string[]
    limit?: number
    startAfterTimestamp?: number
  }): Promise<{ data: AggregatedActivityLog[]; nextStartAfterTimestamp: number | null }> => {
    let query: FirebaseFirestore.Query = collection.orderBy('timestamp', 'desc')

    if (filter?.account) query = query.where('accountLower', '==', filter.account)
    if (filter?.txHash) query = query.where('txHashLower', '==', filter.txHash)
    if (filter?.contractAddress) query = query.where('contractLower', '==', filter.contractAddress)

    // Filter by first tag for Firestore query
    if (filter?.tags?.length) query = query.where('tags', 'array-contains', filter.tags[0])

    if (filter?.startAfterTimestamp) query = query.startAfter(filter.startAfterTimestamp)
    if (filter?.limit) query = query.limit(filter.limit)

    const snapshot = await query.get()
    let data = snapshot.docs.map(doc => doc.data() as AggregatedActivityLog)

    // Filter additional tags (AND logic)
    if (filter?.tags?.length && filter.tags.length > 1) {
      data = data.filter(log => filter.tags!.every(tag => log.tags!.includes(tag)))
    }

    const nextStartAfterTimestamp = data.length ? data[data.length - 1].timestamp : null

    return { data, nextStartAfterTimestamp }
  },

  /**
   * Add a tag to a log
   * @param id Log ID
   * @param tag Tag to add
   */
  addTag: async (id: string, tag: string) => {
    const docRef = collection.doc(id)
    await docRef.update({
      tags: admin.firestore.FieldValue.arrayUnion(tag)
    })
  },

  /**
   * Remove a tag from a log
   * @param id Log ID
   * @param tag Tag to remove
   */
  removeTag: async (id: string, tag: string) => {
    const docRef = collection.doc(id)
    await docRef.update({
      tags: admin.firestore.FieldValue.arrayRemove(tag)
    })
  }
}
