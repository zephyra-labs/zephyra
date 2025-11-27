/**
 * @file walletDTO.test.ts
 * @description Unit tests for CreateWalletLogDTO and UpdateWalletStateDTO.
 */

import { CreateWalletLogDTO, UpdateWalletStateDTO } from '../walletDTO';
import { WalletAction } from '../../types/Wallet';

describe('CreateWalletLogDTO', () => {
  it('should initialize with provided data and default meta', () => {
    const dto = new CreateWalletLogDTO({
      account: '0xABC',
      action: WalletAction.CONNECT,
    });

    expect(dto.account).toBe('0xABC');
    expect(dto.action).toBe(WalletAction.CONNECT);
    expect(dto.meta).toEqual({});
  });

  it('should throw if account is invalid', () => {
    const dto = new CreateWalletLogDTO({
      account: '' as any,
      action: WalletAction.CONNECT,
    });
    expect(() => dto.validate()).toThrow('Invalid or missing "account"');
  });

  it('should throw if action is invalid', () => {
    const dto = new CreateWalletLogDTO({
      account: '0xABC',
      action: 'INVALID' as any,
    });
    expect(() => dto.validate()).toThrow('Invalid "action": INVALID');
  });

  it('should validate successfully for valid data', () => {
    const dto = new CreateWalletLogDTO({
      account: '0xABC',
      action: WalletAction.CONNECT,
      meta: { ip: '127.0.0.1' },
    });
    expect(() => dto.validate()).not.toThrow();
  });

  it('should convert to wallet log object', () => {
    const dto = new CreateWalletLogDTO({
      account: '0xDEF',
      action: WalletAction.DISCONNECT,
      meta: { browser: 'Chrome' },
    });

    const log = dto.toLog();
    expect(log.account).toBe('0xDEF');
    expect(log.action).toBe(WalletAction.DISCONNECT);
    expect(typeof log.timestamp).toBe('number');
    expect(log.meta).toEqual({ browser: 'Chrome' });
  });
});

describe('UpdateWalletStateDTO', () => {
  it('should initialize and validate valid data', () => {
    const dto = new UpdateWalletStateDTO({
      account: '0x123',
      chainId: 1,
      provider: 'MetaMask',
      sessionId: 'sess-001',
    });

    expect(() => dto.validate()).not.toThrow();
    expect(dto.account).toBe('0x123');
    expect(dto.chainId).toBe(1);
    expect(dto.provider).toBe('MetaMask');
  });

  it('should throw if account is missing', () => {
    const dto = new UpdateWalletStateDTO({});
    expect(() => dto.validate()).toThrow('Invalid or missing "account"');
  });

  it('should convert to wallet state object', () => {
    const dto = new UpdateWalletStateDTO({
      account: '0xAAA',
      chainId: 137,
      provider: 'WalletConnect',
      sessionId: 'sess-xyz',
    });

    const state = dto.toState();
    expect(state.account).toBe('0xAAA');
    expect(state.chainId).toBe(137);
    expect(state.provider).toBe('WalletConnect');
    expect(typeof state.lastActiveAt).toBe('number');
    expect(state.sessionId).toBe('sess-xyz');
  });
});
