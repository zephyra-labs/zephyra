import { OnChainInfo } from './Info.js';

export type DocType = "Invoice" | "B/L" | "COO" | "PackingList" | "Other"

export type DocumentStatus = "Draft" | "Reviewed" | "Signed" | "Revoked"

export interface Document {
  tokenId: number
  owner: string
  fileHash: string
  uri: string
  docType: DocType
  linkedContracts: string[]
  status: DocumentStatus
  createdAt: number
  updatedAt?: number
  signer?: string 
  name?: string
  description?: string
  metadataUrl?: string
}

export interface DocumentLogEntry {
  action: 
    | 'mintDocument'
    | 'reviewDocument'
    | 'signDocument'
    | 'revokeDocument'
    | 'linkDocument';
  txHash: string;
  account: string;
  signer?: string;
  linkedContract?: string;
  extra?: any;
  timestamp: number;
  onChainInfo?: OnChainInfo;
}

export interface DocumentLogs {
  tokenId: number;
  contractAddress: string;
  history: DocumentLogEntry[];
}
