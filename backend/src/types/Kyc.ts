import { OnChainInfo } from './Info.js';

export type KYCStatus = 'Draft' | 'Reviewed' | 'Signed' | 'Revoked';

export interface KYC {
  tokenId: string
  owner: string
  fileHash: string
  metadataUrl: string
  documentUrl?: string
  name?: string
  description?: string
  txHash?: string
  createdAt: number
  updatedAt?: number
  status: KYCStatus

  // --- proses internal ---
  reviewedBy?: string
  signature?: string
  remarks?: string
}

export interface KYCLogEntry {
  action: 'mintKYC' | 'reviewKYC' | 'signKYC' | 'revokeKYC' | 'deleteKYC' | 'internal_update';
  txHash: string;
  account: string;
  executor?: string;
  extra?: any;
  timestamp: number;
  onChainInfo?: OnChainInfo;
  details?: {
    status?: string;
    reviewedBy?: string;
    signature?: string;
  };
}

export interface KYCLogs {
  tokenId: number;
  history: KYCLogEntry[];
}
