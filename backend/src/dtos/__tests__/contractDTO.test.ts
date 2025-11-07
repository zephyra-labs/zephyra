/**
 * @file contractDTO.test.ts
 * @description Unit tests for ContractLogDTO.
 */

import ContractLogDTO from '../contractDTO';

describe('ContractLogDTO', () => {
  const baseData = {
    contractAddress: '0xCONTRACT',
    action: 'CREATE',
    txHash: '0xTX123',
    account: '0xACCOUNT',
  };

  it('should initialize with provided data', () => {
    const dto = new ContractLogDTO(baseData);

    expect(dto.contractAddress).toBe('0xCONTRACT');
    expect(dto.action).toBe('CREATE');
    expect(dto.txHash).toBe('0xTX123');
    expect(dto.account).toBe('0xACCOUNT');
  });

  it('should throw validation errors for missing required fields', () => {
    const dto = new ContractLogDTO({
      contractAddress: '',
      action: '',
      txHash: '',
      account: '',
    });

    expect(() => dto.validate()).toThrow('contractAddress required');
  });

  it('should validate successfully for valid data', () => {
    const dto = new ContractLogDTO(baseData);
    expect(() => dto.validate()).not.toThrow();
  });

  it('should convert to a contract log entry object', () => {
    const dto = new ContractLogDTO({
      ...baseData,
      exporter: '0xEXPORTER',
      logistics: ['0xLOG1', '0xLOG2'],
      insurance: '0xINSURANCE',
      inspector: '0xINSPECTOR',
      requiredAmount: '1000',
      extra: { note: 'test' },
      timestamp: 123456789,
    });

    const log = dto.toLogEntry();
    expect(log.action).toBe('CREATE');
    expect(log.txHash).toBe('0xTX123');
    expect(log.account).toBe('0xACCOUNT');
    expect(log.exporter).toBe('0xEXPORTER');
    expect(log.logistics).toEqual(['0xLOG1', '0xLOG2']);
    expect(log.insurance).toBe('0xINSURANCE');
    expect(log.inspector).toBe('0xINSPECTOR');
    expect(log.requiredAmount).toBe('1000');
    expect(log.extra).toEqual({ note: 'test' });
    expect(log.timestamp).toBe(123456789);
  });

  it('should convert to a partial contract state object', () => {
    const dto = new ContractLogDTO({
      ...baseData,
      exporter: '0xEXPORTER',
      importer: '0xIMPORTER',
      logistics: ['0xLOG1'],
      insurance: '0xINSURANCE',
      inspector: '0xINSPECTOR',
      status: 'ACTIVE',
      currentStage: 'STAGE1',
    });

    const state = dto.toState();
    expect(state.exporter).toBe('0xEXPORTER');
    expect(state.importer).toBe('0xIMPORTER');
    expect(state.logistics).toEqual(['0xLOG1']);
    expect(state.insurance).toBe('0xINSURANCE');
    expect(state.inspector).toBe('0xINSPECTOR');
    expect(state.status).toBe('ACTIVE');
    expect(state.currentStage).toBe('STAGE1');
    expect(typeof state.lastUpdated).toBe('number');
  });

  it('should handle default values for optional fields', () => {
    const dto = new ContractLogDTO(baseData);
    const log = dto.toLogEntry();
    const state = dto.toState();

    expect(log.logistics).toEqual([]);
    expect(state.logistics).toEqual([]);
  });
  
  it('should throw if action is missing', () => {
    const dto = new ContractLogDTO({ ...baseData, action: '' });
    expect(() => dto.validate()).toThrow('action required');
  });

  it('should throw if txHash is missing', () => {
    const dto = new ContractLogDTO({ ...baseData, txHash: '' });
    expect(() => dto.validate()).toThrow('txHash required');
  });

  it('should throw if account is missing', () => {
    const dto = new ContractLogDTO({ ...baseData, account: '' });
    expect(() => dto.validate()).toThrow('account required');
  });
});
