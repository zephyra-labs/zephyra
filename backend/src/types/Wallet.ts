export interface WalletLog {
  account: string;
  action: 'connect' | 'disconnect';
  timestamp: number;
}
