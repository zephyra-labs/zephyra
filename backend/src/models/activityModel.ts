import { db } from '../config/firebase.js';
import type { ActivityLog } from '../types/Activity.js';
import type { AggregatedActivityLog } from '../types/AggregatedActivity.js';
import ActivityLogDTO from '../dtos/activityDTO.js';

const activityCollection = db.collection('activityLogs');
const aggregatedCollection = db.collection('aggregatedActivityLogs');

/**
 * Tambah Activity Log dan otomatis ke Aggregated Collection
 */
export const addActivityLog = async (data: Partial<ActivityLog> & { tags?: string[] }): Promise<ActivityLog> => {
  const timestamp = Date.now()
  const entryData: Partial<ActivityLog> = { ...data, timestamp }

  const dto = new ActivityLogDTO(entryData)
  dto.validate()

  const entry: ActivityLog = {
    timestamp,
    type: dto.type,
    action: dto.action,
    account: dto.account,
    txHash: dto.txHash,
    contractAddress: dto.contractAddress,
    extra: dto.extra,
    onChainInfo: dto.onChainInfo,
  }

  await activityCollection.doc(dto.account).collection('history').add(entry)

  const aggregatedEntry: AggregatedActivityLog = {
    id: `${dto.account}_${timestamp}`,
    timestamp,
    type: dto.type,
    action: dto.action,
    account: dto.account,
    accountLower: dto.account.toLowerCase(),
    txHash: dto.txHash,
    txHashLower: dto.txHash?.toLowerCase(),
    contractAddress: dto.contractAddress,
    contractLower: dto.contractAddress?.toLowerCase(),
    extra: dto.extra,
    onChainInfo: dto.onChainInfo,
    tags: data.tags ?? [],
  }

  await aggregatedCollection.doc(aggregatedEntry.id).set(aggregatedEntry)

  return entry
}

/**
 * Ambil semua account yang punya activity
 */
export const getAllAccounts = async (): Promise<string[]> => {
  const snapshot = await activityCollection.get();
  return snapshot.docs.map(doc => doc.id);
};

/**
 * Ambil activity log per account dengan pagination
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
 * Ambil semua activity log global dengan pagination dan filter
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
    // Jika account spesifik
    let query: FirebaseFirestore.Query = activityCollection
      .doc(filter.account)
      .collection('history')
      .orderBy('timestamp', 'desc');

    if (startAfter) query = query.startAfter(startAfter);
    query = query.limit(limit);

    const snapshot = await query.get();
    logs = snapshot.docs.map(doc => doc.data() as ActivityLog);
  } else {
    // Global: iterasi semua akun
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

  // Filter txHash / contractAddress di memory
  if (filter?.txHash) logs = logs.filter(l => l.txHash === filter.txHash);
  if (filter?.contractAddress) logs = logs.filter(l => l.contractAddress === filter.contractAddress);

  // Sort descending
  logs.sort((a, b) => b.timestamp - a.timestamp);

  // Slice sesuai limit
  if (logs.length > limit) logs = logs.slice(0, limit);

  return logs;
};
