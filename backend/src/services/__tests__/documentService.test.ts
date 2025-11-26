/**
 * @file documentService.test.ts
 * @description Exhaustive unit tests for DocumentService to achieve full branch coverage.
 */

import { DocumentService } from '../documentService';
import { DocumentModel } from '../../models/documentModel';
import { notifyWithAdmins, notifyUsers } from '../../utils/notificationHelper';
import { getContractRoles } from '../../utils/getContractRoles';
import DocumentDTO from '../../dtos/documentDTO';

// Mock viem's getAddress to return input unchanged so assertions don't need checksummed addresses
jest.mock('viem', () => ({
  getAddress: (a: string) => a,
}));

// Mock modules
jest.mock('../../models/documentModel', () => ({
  DocumentModel: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    getByOwner: jest.fn(),
    getByContract: jest.fn(),
    addLog: jest.fn(),
    getLogs: jest.fn(),
  },
}));

jest.mock('../../utils/notificationHelper', () => ({
  notifyWithAdmins: jest.fn(),
  notifyUsers: jest.fn(),
}));

jest.mock('../../utils/getContractRoles', () => ({
  getContractRoles: jest.fn(),
}));

// Mock DocumentDTO: exposes linkedContracts, tokenId, signer, toFirestore
jest.mock('../../dtos/documentDTO', () =>
  jest.fn().mockImplementation((data: any) => ({
    linkedContracts: data.linkedContracts ?? data.linkedContracts === undefined ? data.linkedContracts : [],
    tokenId: data.tokenId ?? 1,
    signer: data.signer ?? null,
    toFirestore: () => data,
  }))
);

const MOCK_ADDRESS_1 = '0x1111111111111111111111111111111111111111';
const MOCK_ADDRESS_2 = '0x2222222222222222222222222222222222222222';
const MOCK_ADDRESS_3 = '0x3333333333333333333333333333333333333333';
const MOCK_ADDRESS_4 = '0x4444444444444444444444444444444444444444';

const sampleDoc = {
  tokenId: 1,
  owner: MOCK_ADDRESS_1,
  fileHash: '0xHash',
  uri: 'https://example.com/doc.pdf',
  docType: 'Invoice',
  linkedContracts: [MOCK_ADDRESS_2],
  status: 'Draft',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  signer: MOCK_ADDRESS_3,
  name: 'Test Document',
  description: 'Test description',
};

describe('DocumentService - full coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default model behaviors
    (DocumentModel.create as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.update as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.delete as jest.Mock).mockResolvedValue(true);
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.getAll as jest.Mock).mockResolvedValue([sampleDoc]);
    (DocumentModel.getByOwner as jest.Mock).mockResolvedValue([sampleDoc]);
    (DocumentModel.getByContract as jest.Mock).mockResolvedValue([sampleDoc]);
    (DocumentModel.getLogs as jest.Mock).mockResolvedValue([{ action: 'mint', account: MOCK_ADDRESS_1 }]);

    // Default contract roles
    (getContractRoles as jest.Mock).mockResolvedValue({
      importer: MOCK_ADDRESS_1,
      exporter: MOCK_ADDRESS_2,
      logistics: MOCK_ADDRESS_3,
    });
  });

  // -------------------- createDocument --------------------
  it('createDocument - successful creation, logs, and notifications', async () => {
    // DocumentDTO will give linkedContracts [MOCK_ADDRESS_2] via data input
    const input = { linkedContracts: [MOCK_ADDRESS_2], tokenId: 123, signer: MOCK_ADDRESS_3 };
    const res = await DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument', '0xTxHash');

    expect(DocumentModel.create).toHaveBeenCalledWith(expect.any(Object));
    // addLog called for each linked contract (1)
    expect(DocumentModel.addLog).toHaveBeenCalledTimes(1);
    // notifyWithAdmins called once
    expect(notifyWithAdmins).toHaveBeenCalled();
    // notifyUsers called, recipients should exclude the normalized actor (MOCK_ADDRESS_1)
    expect(notifyUsers).toHaveBeenCalled();
    expect(res).toEqual(sampleDoc);
  });

  it('createDocument - throws when linkedContracts missing/empty', async () => {
    // DocumentDTO mock will get linkedContracts = [] if we pass that explicitly
    const input = { linkedContracts: [] };
    await expect(DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument'))
      .rejects.toThrow('Document must link to at least one contract');
  });

  it('createDocument - throws when contract has no roles', async () => {
    (getContractRoles as jest.Mock).mockResolvedValue({ importer: null, exporter: null, logistics: null });
    // DocumentDTO input will have linkedContracts with one contract id string '0xC'
    const input = { linkedContracts: ['0xC'] };
    await expect(DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument'))
      .rejects.toThrow('Contract 0xC has no assigned roles');
  });

  it('createDocument - throws when actor unauthorized for contract', async () => {
    // roles are different addresses so normalized actor does not match any
    (getContractRoles as jest.Mock).mockResolvedValue({
      importer: MOCK_ADDRESS_4,
      exporter: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      logistics: null,
    });
    const input = { linkedContracts: [MOCK_ADDRESS_2] };
    await expect(DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument'))
      .rejects.toThrow(`Unauthorized account for ${MOCK_ADDRESS_2}`);
  });
  
  // -------------------- safeAddress branch coverage --------------------
  it('createDocument - throws when account is null/undefined/empty', async () => {
    const input = { linkedContracts: [MOCK_ADDRESS_2], tokenId: 1 };

    // undefined account
    await expect(DocumentService.createDocument(input as any, undefined as any, 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');

    // null account
    await expect(DocumentService.createDocument(input as any, null as any, 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');

    // empty string account
    await expect(DocumentService.createDocument(input as any, '', 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');
  });

  // -------------------- updateDocument --------------------
  it('updateDocument - throws when document missing', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
    await expect(DocumentService.updateDocument(99, {}, MOCK_ADDRESS_1, 'reviewDocument'))
      .rejects.toThrow('Document 99 not found');
  });

  it('updateDocument - throws when update fails (update returns falsy)', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.update as jest.Mock).mockResolvedValue(null);
    await expect(DocumentService.updateDocument(sampleDoc.tokenId, { name: 'X' } as any, MOCK_ADDRESS_1, 'reviewDocument'))
      .rejects.toThrow(`Failed to update document ${sampleDoc.tokenId}`);
  });

  it('updateDocument - success adds logs, resolves roles, and notifies', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
    (getContractRoles as jest.Mock).mockResolvedValue({
      importer: MOCK_ADDRESS_1,
      exporter: MOCK_ADDRESS_2,
      logistics: MOCK_ADDRESS_3,
    });

    const updated = await DocumentService.updateDocument(sampleDoc.tokenId, { name: 'Updated' } as any, MOCK_ADDRESS_1, 'reviewDocument', '0xTx2');

    // Should add logs for each linked contract (1)
    expect(DocumentModel.addLog).toHaveBeenCalledTimes(sampleDoc.linkedContracts.length);
    // Should call notifyWithAdmins and notifyUsers
    expect(notifyWithAdmins).toHaveBeenCalled();
    expect(notifyUsers).toHaveBeenCalled();
    expect(updated).toEqual(sampleDoc);
  });
  
  it('updateDocument - throws when account is null/undefined/empty', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);

    await expect(DocumentService.updateDocument(1, {}, undefined as any, 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');

    await expect(DocumentService.updateDocument(1, {}, null as any, 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');

    await expect(DocumentService.updateDocument(1, {}, '', 'mintDocument'))
      .rejects.toThrow('Address missing or invalid');
  });

  // -------------------- deleteDocument --------------------
  it('deleteDocument - returns false when document not found', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
    const res = await DocumentService.deleteDocument(999, MOCK_ADDRESS_1, 'revokeDocument');
    expect(res).toBe(false);
  });

  it('deleteDocument - returns false when delete fails', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.delete as jest.Mock).mockResolvedValue(false);
    const res = await DocumentService.deleteDocument(sampleDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument');
    expect(res).toBe(false);
  });

  it('deleteDocument - success logs and notifies', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
    (DocumentModel.delete as jest.Mock).mockResolvedValue(true);

    const res = await DocumentService.deleteDocument(sampleDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument', '0xTxDel');

    // addLog called for each linked contract
    expect(DocumentModel.addLog).toHaveBeenCalledTimes(sampleDoc.linkedContracts.length);
    // notifyWithAdmins called and notifyUsers called with empty recipient list
    expect(notifyWithAdmins).toHaveBeenCalled();
    expect(notifyUsers).toHaveBeenCalledWith([], expect.any(Object), expect.any(String));
    expect(res).toBe(true);
  });

  // -------------------- retrieval helpers --------------------
  it('getAllDocuments - attaches history to each document', async () => {
    (DocumentModel.getAll as jest.Mock).mockResolvedValue([sampleDoc, { ...sampleDoc, tokenId: 2 }]);
    (DocumentModel.getLogs as jest.Mock).mockImplementation(async (tokenId: number) => [{ action: `log-${tokenId}` }]);
    const res = await DocumentService.getAllDocuments();
    expect(res).toHaveLength(2);
    expect(res[0]).toHaveProperty('history');
    expect(res[0].history[0]).toEqual({ action: 'log-1' });
    expect(res[1].history[0]).toEqual({ action: 'log-2' });
  });

  it('getDocumentById - returns null when missing and returns doc+history when exists', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValueOnce(null);
    const missing = await DocumentService.getDocumentById(999);
    expect(missing).toBeNull();

    (DocumentModel.getById as jest.Mock).mockResolvedValueOnce(sampleDoc);
    (DocumentModel.getLogs as jest.Mock).mockResolvedValueOnce([{ action: 'a' }]);
    const found = await DocumentService.getDocumentById(sampleDoc.tokenId);
    expect(found).not.toBeNull();
    expect(found?.history).toEqual([{ action: 'a' }]);
  });

  it('getDocumentsByOwner - returns docs with history', async () => {
    (DocumentModel.getByOwner as jest.Mock).mockResolvedValue([sampleDoc]);
    (DocumentModel.getLogs as jest.Mock).mockResolvedValue([{ action: 'owner-log' }]);
    const res = await DocumentService.getDocumentsByOwner(MOCK_ADDRESS_1);
    expect(res[0].history[0]).toEqual({ action: 'owner-log' });
  });

  it('getDocumentsByContract - returns docs with history', async () => {
    (DocumentModel.getByContract as jest.Mock).mockResolvedValue([sampleDoc]);
    (DocumentModel.getLogs as jest.Mock).mockResolvedValue([{ action: 'contract-log' }]);
    const res = await DocumentService.getDocumentsByContract(MOCK_ADDRESS_2);
    expect(res[0].history[0]).toEqual({ action: 'contract-log' });
  });
});
