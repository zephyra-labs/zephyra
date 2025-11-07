/**
 * @file getContractRoles.test.ts
 * @description Unit tests for getContractRoles helper function using Jest.
 */

import { getContractRoles } from '../getContractRoles';
import { db } from '../../config/firebase';
import type { ContractLogEntry, ContractRoles } from '../../types/Contract';

// --- Mock Firestore ---
jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe('getContractRoles', () => {
  const mockCollection = {
    where: jest.fn(),
  };
  const mockQuery = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db.collection as jest.Mock).mockReturnValue(mockCollection);
    mockCollection.where.mockReturnValue(mockQuery);
  });

  /**
   * @test empty snapshot
   * Should return empty roles if no contract logs found
   */
  it('should return empty roles if no contract logs found', async () => {
    mockQuery.get.mockResolvedValue({ empty: true, docs: [] });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '', exporter: '', logistics: '' });
  });

  /**
   * @test deploy log missing
   * Should return empty roles if deploy log is missing
   */
  it('should return empty roles if deploy log missing', async () => {
    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [
        { data: () => ({ history: [{ action: 'update' }] }) },
      ],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '', exporter: '', logistics: '' });
  });

  /**
   * @test deploy log with roles
   * Should return roles from deploy log if exists
   */
  it('should return roles from deploy log', async () => {
    const history: ContractLogEntry[] = [
      {
        action: 'deploy',
        extra: { importer: '0xImp', exporter: '0xExp', logistics: '0xLog' },
        txHash: '0xTx',
        account: '0xAccount',
        timestamp: Date.now(),
      },
    ];

    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ history }) }],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '0xImp', exporter: '0xExp', logistics: '0xLog' });
  });

  /**
   * @test deploy log missing extra
   * Should return empty roles if deploy log has no extra
   */
  it('should return empty roles if deploy log has no extra', async () => {
    const history: ContractLogEntry[] = [
      {
        action: 'deploy',
        extra: undefined,
        txHash: '0xTx',
        account: '0xAccount',
        timestamp: Date.now(),
      },
    ];

    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ history }) }],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '', exporter: '', logistics: '' });
  });

  /**
   * @test multiple logs
   * Should return the first deploy log roles
   */
  it('should handle multiple deploy and update logs correctly', async () => {
    const history: ContractLogEntry[] = [
      { action: 'update', extra: { importer: '0xOld' }, txHash: '0xTx1', account: '0xAcc1', timestamp: Date.now() },
      { action: 'deploy', extra: { importer: '0xImp', exporter: '0xExp', logistics: '0xLog' }, txHash: '0xTx2', account: '0xAcc2', timestamp: Date.now() },
    ];

    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ history }) }],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '0xImp', exporter: '0xExp', logistics: '0xLog' });
  });

  /**
   * @test partial roles in extra
   * Should fallback to empty string for missing roles
   */
  it('should use empty string fallback if some roles missing in deploy log extra', async () => {
    const history: ContractLogEntry[] = [
      {
        action: 'deploy',
        extra: { importer: '0xImp' }, // exporter & logistics missing
        txHash: '0xTx',
        account: '0xAccount',
        timestamp: Date.now(),
      },
    ];

    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ history }) }],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '0xImp', exporter: '', logistics: '' });
  });

  /**
   * @test completely empty extra
   * Should fallback to all empty strings
   */
  it('should handle completely empty extra object', async () => {
    const history: ContractLogEntry[] = [
      {
        action: 'deploy',
        extra: {},
        txHash: '0xTx',
        account: '0xAccount',
        timestamp: Date.now(),
      },
    ];

    mockQuery.get.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ history }) }],
    });

    const result: ContractRoles = await getContractRoles('0xContract');
    expect(result).toEqual({ importer: '', exporter: '', logistics: '' });
  });
});
