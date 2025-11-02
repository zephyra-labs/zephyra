/**
 * @file activityLogsModel.ts
 * @description Firestore service for managing activity logs per account and aggregated logs globally.
 */

import { db } from '../config/firebase.js';
import type { ActivityLog } from '../types/Activity.js';
import type { AggregatedActivityLog } from '../types/AggregatedActivity.js';
import ActivityLogDTO from '../dtos/activityDTO.js';

/** Firestore collection references */
const activityCollection = db.collection('activityLogs');
const aggregatedCollection = db.collection('aggregatedActivityLogs');

/**
 * Add a new activity log and automatically update aggregated logs
 * @param data Partial activity log data with optional tags
 * @returns The newly created ActivityLog
 */
export const addActivityLog = async (
  data: Partial<ActivityLog> & { tags?: string[] }
): Promise<ActivityLog> => {
  const timestamp = Date.now();
  const dto = new ActivityLogDTO({ ...data, timestamp });
  dto.validate();

  const entry: ActivityLog = {
    timestamp,
    type: dto.type,
    action: dto.action,
    account: dto.account,
    txHash: dto.txHash,
    contractAddress: dto.contractAddress,
    extra: dto.extra,
    onChainInfo: dto.onChainInfo,
  };

  // Save per-account history
  await activityCollection.doc(dto.account).collection('history').add(entry);

  // Save aggregated log
  const aggregatedEntry: AggregatedActivityLog = {
    id: `${dto.account}_${timestamp}`,
    timestamp,
    type: dto.type,
    action: dto.action,
    account: dto.account,
    accountLower: dto.account,
    txHash: dto.txHash,
    txHashLower: dto.txHash,
    contractAddress: dto.contractAddress,
    contractLower: dto.contractAddress,
    extra: dto.extra,
    onChainInfo: dto.onChainInfo,
    tags: data.tags ?? [],
  };

  await aggregatedCollection.doc(aggregatedEntry.id).set(aggregatedEntry);

  return entry;
};

/**
 * Get all accounts that have activity logs
 * @returns Array of account strings
 */
export const getAllAccounts = async (): Promise<string[]> => {
  const snapshot = await activityCollection.get();
  return snapshot.docs.map(doc => doc.id);
};

/**
 * Get activity logs for a specific account with pagination
 * @param account Account address
 * @param options Pagination options
 * @returns Array of ActivityLog
 */
export const getActivityByAccount = async (
  account: string,
  options?: { limit?: number; startAfterTimestamp?: number }
): Promise<ActivityLog[]> => {
  let query: FirebaseFirestore.Query = activityCollection
    .doc(account)
    .collection('history')
    .orderBy('timestamp', 'desc');

  if (options?.startAfterTimestamp) query = query.startAfter(options.startAfterTimestamp);
  if (options?.limit) query = query.limit(options.limit);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as ActivityLog);
};

/**
 * Get all activity logs globally, with optional filters for account, txHash, or contract
 * Supports pagination by timestamp and limit
 * @param filter Optional filters and pagination
 * @returns Array of ActivityLog
 */
export const getAllActivities = async (filter?: {
  account?: string;
  txHash?: string;
  contractAddress?: string;
  limit?: number;
  startAfterTimestamp?: number;
}): Promise<ActivityLog[]> => {
  const limit = filter?.limit ?? 20;
  const startAfter = filter?.startAfterTimestamp;

  let logs: ActivityLog[] = [];

  if (filter?.account) {
    // Query for specific account
    let query: FirebaseFirestore.Query = activityCollection
      .doc(filter.account)
      .collection('history')
      .orderBy('timestamp', 'desc');

    if (startAfter) query = query.startAfter(startAfter);
    query = query.limit(limit);

    const snapshot = await query.get();
    logs = snapshot.docs.map(doc => doc.data() as ActivityLog);
  } else {
    // Query globally: iterate over all accounts
    const accountsSnapshot = await activityCollection.get();
    const accountIds = accountsSnapshot.docs.map(doc => doc.id);

    const promises = accountIds.map(async acc => {
      let q: FirebaseFirestore.Query = activityCollection
        .doc(acc)
        .collection('history')
        .orderBy('timestamp', 'desc');

      if (startAfter) q = q.startAfter(startAfter);
      q = q.limit(limit);

      const snap = await q.get();
      return snap.docs.map(doc => doc.data() as ActivityLog);
    });

    const results = await Promise.all(promises);
    logs = results.flat();
  }

  // Filter in-memory for txHash and contractAddress
  if (filter?.txHash) logs = logs.filter(l => l.txHash === filter.txHash);
  if (filter?.contractAddress) logs = logs.filter(l => l.contractAddress === filter.contractAddress);

  // Sort descending by timestamp
  logs.sort((a, b) => b.timestamp - a.timestamp);

  // Limit results
  if (logs.length > limit) logs = logs.slice(0, limit);

  return logs;
};

/**
 * Get aggregated logs globally with optional filtering and pagination
 * @param filter Optional filter object
 * @returns Array of AggregatedActivityLog
 */
export const getAggregatedActivities = async (filter?: {
  account?: string;
  txHash?: string;
  contractAddress?: string;
  tags?: string[];
  limit?: number;
  startAfterTimestamp?: number;
}): Promise<AggregatedActivityLog[]> => {
  let query: FirebaseFirestore.Query = aggregatedCollection.orderBy('timestamp', 'desc');

  if (filter?.account) query = query.where('accountLower', '==', filter.account);
  if (filter?.txHash) query = query.where('txHashLower', '==', filter.txHash);
  if (filter?.contractAddress) query = query.where('contractLower', '==', filter.contractAddress);
  if (filter?.tags?.length) query = query.where('tags', 'array-contains', filter.tags[0]);
  if (filter?.startAfterTimestamp) query = query.startAfter(filter.startAfterTimestamp);
  if (filter?.limit) query = query.limit(filter.limit);

  const snapshot = await query.get();
  let data = snapshot.docs.map(doc => doc.data() as AggregatedActivityLog);

  // AND filtering for tags beyond first
  if (filter?.tags?.length && filter.tags.length > 1) {
    data = data.filter(log => filter.tags!.every(tag => log.tags!.includes(tag)));
  }

  return data;
};
