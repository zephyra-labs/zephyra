import type { ActivityLog } from '../types/Activity.js';

export default class ActivityLogDTO {
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

  constructor(data: Partial<ActivityLog>) {
    Object.assign(this, data);
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

  toJSON(): ActivityLog {
    return {
      timestamp: this.timestamp ?? Date.now(),
      type: this.type,
      action: this.action,
      account: this.account,
      txHash: this.txHash,
      contractAddress: this.contractAddress,
      extra: this.extra,
      onChainInfo: this.onChainInfo,
    };
  }
}
