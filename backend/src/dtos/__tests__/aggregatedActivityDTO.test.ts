/**
 * @file AggregatedActivityDTO.test.ts
 * @description Unit tests for AggregatedActivityDTO.
 */

import AggregatedActivityLog from '../aggregatedActivityDTO';

describe('AggregatedActivityLog', () => {
  const baseData = {
    timestamp: 123456789,
    type: 'backend' as const,
    action: 'LOGIN',
    account: '0xACCOUNT',
  };

  it('should initialize with provided data and generate ID if missing', () => {
    const dto = new AggregatedActivityLog(baseData);

    expect(dto.timestamp).toBe(123456789);
    expect(dto.type).toBe('backend');
    expect(dto.action).toBe('LOGIN');
    expect(dto.account).toBe('0xACCOUNT');
    expect(dto.id).toBe(`${dto.account}-${dto.timestamp}-${dto.action}`);
    expect(dto.accountLower).toBe('0xACCOUNT');
    expect(dto.txHashLower).toBeUndefined();
    expect(dto.contractLower).toBeUndefined();
  });

  it('should preserve provided ID and lowercase fields', () => {
    const dto = new AggregatedActivityLog({
      ...baseData,
      id: 'custom-id',
      txHash: '0xTX',
      contractAddress: '0xCONTRACT',
    });

    expect(dto.id).toBe('custom-id');
    expect(dto.txHashLower).toBe('0xTX');
    expect(dto.contractLower).toBe('0xCONTRACT');
  });

  it('should throw validation errors for missing required fields', () => {
    const dto = new AggregatedActivityLog({} as any);

    expect(() => dto.validate()).toThrow('timestamp required');

    dto.timestamp = 123;
    expect(() => dto.validate()).toThrow('type required');

    dto.type = 'backend';
    expect(() => dto.validate()).toThrow('action required');

    dto.action = 'ACTION';
    expect(() => dto.validate()).toThrow('account required');

    dto.account = '0xA';
    expect(() => dto.validate()).not.toThrow();
  });

  it('should require contractAddress for onChain logs', () => {
    const dto = new AggregatedActivityLog({
      timestamp: 123,
      type: 'onChain',
      action: 'TRANSFER',
      account: '0xA',
    });

    expect(() => dto.validate()).toThrow('contractAddress required for onChain logs');

    dto.contractAddress = '0xCONTRACT';
    expect(() => dto.validate()).not.toThrow();
  });

  it('should convert to AggregatedActivityLog object', () => {
    const dto = new AggregatedActivityLog({
      ...baseData,
      txHash: '0xTX',
      contractAddress: '0xCONTRACT',
      extra: { note: 'test' },
      onChainInfo: { status: 'CONFIRMED', blockNumber: 100, confirmations: 12 },
      tags: ['tag1', 'tag2'],
    });

    const json = dto.toJSON();

    expect(json.id).toBe(dto.id);
    expect(json.timestamp).toBe(dto.timestamp);
    expect(json.type).toBe('backend');
    expect(json.action).toBe('LOGIN');
    expect(json.account).toBe('0xACCOUNT');
    expect(json.txHash).toBe('0xTX');
    expect(json.contractAddress).toBe('0xCONTRACT');
    expect(json.extra).toEqual({ note: 'test' });
    expect(json.onChainInfo).toEqual({ status: 'CONFIRMED', blockNumber: 100, confirmations: 12 });
    expect(json.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle optional fields being undefined', () => {
    const dto = new AggregatedActivityLog(baseData);
    const json = dto.toJSON();

    expect(json.txHash).toBeUndefined();
    expect(json.contractAddress).toBeUndefined();
    expect(json.extra).toBeUndefined();
    expect(json.onChainInfo).toBeUndefined();
    expect(json.tags).toBeUndefined();
  });
});
