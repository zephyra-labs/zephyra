import { ActivityLog } from "./Activity.js";

export interface AggregatedActivityLog extends ActivityLog {
  id: string; 
  accountLower?: string;
  txHashLower?: string;
  contractLower?: string;
  tags?: string[];        
}
