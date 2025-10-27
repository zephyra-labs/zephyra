import { WalletLog } from '../types/Wallet.js';

export default class WalletLogDTO {
  account!: string;
  action!: 'connect' | 'disconnect';

  constructor(data: Partial<WalletLog>) {
    Object.assign(this, data);
  }

  validate() {
    if (!this.account) throw new Error('account is required');
    if (!['connect', 'disconnect'].includes(this.action)) throw new Error('invalid action');
  }

  toJSON() {
    return {
      account: this.account,
      action: this.action,
      timestamp: Date.now(),
    };
  }
}
