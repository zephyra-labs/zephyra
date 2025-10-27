import type { OnChainInfo } from "./Info"

export type KYCStatus = 'Draft' | 'Reviewed' | 'Signed' | 'Revoked';

export interface KYC {
  tokenId: string
  owner: string
  fileHash: string
  metadataUrl: string
  documentUrl?: string
  name?: string
  description?: string
  createdAt: number
  updatedAt?: number
  status: KYCStatus;
  txHash?: string
  history?: KYCLogEntry[]
}

export interface KYCLogEntry {
  action: 'mintKYC' | 'reviewKYC' | 'signKYC' | 'revokeKYC' | 'deleteKYC';
  txHash: string;
  account: string;
  executor?: string;
  extra?: any;
  timestamp: number;
  onChainInfo?: OnChainInfo;
}


export interface KYCLogs {
  tokenId: number;
  history: KYCLogEntry[];
}

export interface UpdateKycArgs {
  tokenId: string
  payload: Partial<KYC>
  action?: string
  txHash?: string
  executor: string
  account: string
  status?: KYCStatus
}