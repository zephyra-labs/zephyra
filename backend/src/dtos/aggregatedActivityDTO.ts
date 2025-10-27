import type { AggregatedActivityLog } from '../types/AggregatedActivity.js';

export default class AggregatedActivityLogDTO {
  id!: string;
  timestamp!: number;
  type!: 'onChain' | 'backend';
  action!: string;
  account!: string;
  txHash?: string;
  contractAddress?: string;
  extra?: Record<string, any>;
  onChainInfo?: {
    status: string;
    blockNumber: number;
    confirmations: number;
  };
  accountLower?: string;
  txHashLower?: string;
  contractLower?: string;
  tags?: string[];

  constructor(data: Partial<AggregatedActivityLog>) {
    Object.assign(this, data);
    if (!this.id) {
      this.id = `${this.account}-${this.timestamp}-${this.action}`;
    }
    this.accountLower = this.account?.toLowerCase();
    this.txHashLower = this.txHash?.toLowerCase();
    this.contractLower = this.contractAddress?.toLowerCase();
  }

  validate() {
    if (!this.timestamp) throw new Error('timestamp required');
    if (!this.type) throw new Error('type required');
    if (!this.action) throw new Error('action required');
    if (!this.account) throw new Error('account required');
    if (this.type === 'onChain' && !this.contractAddress) {
      throw new Error('contractAddress required for onChain logs');
    }
  }

  toJSON(): AggregatedActivityLog {
    return {
      id: this.id,
      timestamp: this.timestamp ?? Date.now(),
      type: this.type,
      action: this.action,
      account: this.account,
      txHash: this.txHash,
      contractAddress: this.contractAddress,
      extra: this.extra,
      onChainInfo: this.onChainInfo,
      accountLower: this.accountLower,
      txHashLower: this.txHashLower,
      contractLower: this.contractLower,
      tags: this.tags,
    };
  }
}
