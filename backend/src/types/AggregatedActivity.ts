/**
 * @file AggregatedActivityLog.ts
 * @description Extended activity log with aggregation metadata and tags
 */

import { ActivityLog } from "./Activity.js";

/**
 * Represents an aggregated activity log entry with extra metadata for search and tagging
 * @extends ActivityLog
 */
export interface AggregatedActivityLog extends ActivityLog {
  /** Unique ID for this aggregated log entry */
  id: string;

  /** Lowercase version of the account for indexing/searching */
  accountLower?: string;

  /** Lowercase version of the transaction hash for indexing/searching */
  txHashLower?: string;

  /** Lowercase version of the related contract address for indexing/searching */
  contractLower?: string;

  /** Optional list of tags associated with this activity */
  tags?: string[];
}
