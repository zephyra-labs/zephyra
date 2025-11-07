/**
 * @file activityDTO.test.ts
 * @description Unit tests for ActivityLogDTO with full coverage.
 */

import ActivityLogDTO from '../activityDTO';

describe('ActivityLogDTO', () => {
  const baseData = {
    timestamp: 123456789,
    type: 'backend' as const,
    action: 'CREATE',
    account: '0xACCOUNT',
  };

  it('should initialize with provided data', () => {
    const dto = new ActivityLogDTO(baseData);

    expect(dto.timestamp).toBe(123456789);
    expect(dto.type).toBe('backend');
    expect(dto.action).toBe('CREATE');
    expect(dto.account).toBe('0xACCOUNT');
  });

  it('should throw validation errors for missing required fields', () => {
    const dto = new ActivityLogDTO({
      timestamp: 0,
      type: '' as any,
      action: '',
      account: '',
    });

    expect(() => dto.validate()).toThrow('timestamp required');
  });

  it('should throw if type is missing', () => {
    const dto = new ActivityLogDTO({ ...baseData, type: '' as any });
    expect(() => dto.validate()).toThrow('type required');
  });

  it('should throw if action is missing', () => {
    const dto = new ActivityLogDTO({ ...baseData, action: '' });
    expect(() => dto.validate()).toThrow('action required');
  });

  it('should throw if account is missing', () => {
    const dto = new ActivityLogDTO({ ...baseData, account: '' });
    expect(() => dto.validate()).toThrow('account required');
  });

  it('should throw if onChain type but contractAddress missing', () => {
    const dto = new ActivityLogDTO({ ...baseData, type: 'onChain' });
    expect(() => dto.validate()).toThrow('contractAddress required for onChain logs');
  });

  it('should validate successfully for valid backend data', () => {
    const dto = new ActivityLogDTO(baseData);
    expect(() => dto.validate()).not.toThrow();
  });

  it('should validate successfully for valid onChain data', () => {
    const dto = new ActivityLogDTO({
      ...baseData,
      type: 'onChain',
      contractAddress: '0xCONTRACT',
    });
    expect(() => dto.validate()).not.toThrow();
  });

  it('should convert to ActivityLog object', () => {
    const dto = new ActivityLogDTO({
      ...baseData,
      txHash: '0xTX123',
      contractAddress: '0xCONTRACT',
      extra: { note: 'test' },
      onChainInfo: { status: 'SUCCESS', blockNumber: 100, confirmations: 5 },
    });

    const log = dto.toJSON();
    expect(log.timestamp).toBe(123456789);
    expect(log.type).toBe('backend');
    expect(log.action).toBe('CREATE');
    expect(log.account).toBe('0xACCOUNT');
    expect(log.txHash).toBe('0xTX123');
    expect(log.contractAddress).toBe('0xCONTRACT');
    expect(log.extra).toEqual({ note: 'test' });
    expect(log.onChainInfo).toEqual({ status: 'SUCCESS', blockNumber: 100, confirmations: 5 });
  });

  it('should use default timestamp if timestamp is undefined', () => {
    const dto = new ActivityLogDTO({ ...baseData, timestamp: undefined });
    const log = dto.toJSON();
    expect(typeof log.timestamp).toBe('number');
    expect(log.timestamp).toBeGreaterThan(0);
  });
});
