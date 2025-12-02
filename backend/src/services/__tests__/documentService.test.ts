/**
 * @file documentService.test.ts
 * @description Unit tests for DocumentService with full branch coverage.
 */

import { DocumentService } from '../documentService';
import { DocumentModel } from '../../models/documentModel';
import { notifyWithAdmins, notifyUsers } from '../../utils/notificationHelper';
import { getContractRoles } from '../../utils/getContractRoles';
import DocumentDTO from '../../dtos/documentDTO';

// Mock viem getAddress to return input unchanged
jest.mock('viem', () => ({ getAddress: (a: string) => a }));

// -------------------- Mock modules --------------------
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

jest.mock('../../dtos/documentDTO', () =>
  jest.fn().mockImplementation((data: any) => ({
    linkedContracts: data.linkedContracts ?? [],
    tokenId: data.tokenId ?? 1,
    signer: data.signer ?? null,
    toFirestore: () => data,
  }))
);

// -------------------- Constants --------------------
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

// -------------------- Tests --------------------
describe('DocumentService', () => {
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
  describe('createDocument', () => {
    it('creates document and notifies admins/users', async () => {
      const input = { linkedContracts: [MOCK_ADDRESS_2], tokenId: 123, signer: MOCK_ADDRESS_3 };
      const res = await DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument', '0xTxHash');

      expect(DocumentModel.create).toHaveBeenCalledWith(expect.any(Object));
      expect(DocumentModel.addLog).toHaveBeenCalledTimes(1);
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(notifyUsers).toHaveBeenCalled();
      expect(res).toEqual(sampleDoc);
    });

    it('throws if linkedContracts empty', async () => {
      await expect(DocumentService.createDocument({ linkedContracts: [] } as any, MOCK_ADDRESS_1, 'mintDocument'))
        .rejects.toThrow('Document must link to at least one contract');
    });

    it('throws if contract has no roles', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({ importer: null, exporter: null, logistics: null });
      await expect(DocumentService.createDocument({ linkedContracts: ['0xC'] } as any, MOCK_ADDRESS_1, 'mintDocument'))
        .rejects.toThrow('Contract 0xC has no assigned roles');
    });

    it('throws if actor unauthorized', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({ importer: MOCK_ADDRESS_4, exporter: '0xdead', logistics: null });
      await expect(DocumentService.createDocument({ linkedContracts: [MOCK_ADDRESS_2] } as any, MOCK_ADDRESS_1, 'mintDocument'))
        .rejects.toThrow(`Unauthorized account for ${MOCK_ADDRESS_2}`);
    });

    it('throws if account invalid', async () => {
      const input = { linkedContracts: [MOCK_ADDRESS_2], tokenId: 1 };
      await expect(DocumentService.createDocument(input as any, undefined as any, 'mintDocument')).rejects.toThrow('Address missing or invalid');
      await expect(DocumentService.createDocument(input as any, null as any, 'mintDocument')).rejects.toThrow('Address missing or invalid');
      await expect(DocumentService.createDocument(input as any, '', 'mintDocument')).rejects.toThrow('Address missing or invalid');
    });

    it('defaults txHash to empty string if undefined', async () => {
      const input = { linkedContracts: [MOCK_ADDRESS_2], tokenId: 999 };
      await DocumentService.createDocument(input as any, MOCK_ADDRESS_1, 'mintDocument', undefined);
      expect(DocumentModel.addLog).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ txHash: '' }));
    });
  });

  // -------------------- updateDocument --------------------
  describe('updateDocument', () => {
    it('throws if document not found', async () => {
      (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
      await expect(DocumentService.updateDocument(99, {}, MOCK_ADDRESS_1, 'reviewDocument'))
        .rejects.toThrow('Document 99 not found');
    });

    it('throws if update fails', async () => {
      (DocumentModel.update as jest.Mock).mockResolvedValue(null);
      await expect(DocumentService.updateDocument(sampleDoc.tokenId, { name: 'X' } as any, MOCK_ADDRESS_1, 'reviewDocument'))
        .rejects.toThrow(`Failed to update document ${sampleDoc.tokenId}`);
    });

    it('logs, resolves roles, notifies on success', async () => {
      const updated = await DocumentService.updateDocument(sampleDoc.tokenId, { name: 'Updated' } as any, MOCK_ADDRESS_1, 'reviewDocument', '0xTx2');
      expect(DocumentModel.addLog).toHaveBeenCalledTimes(sampleDoc.linkedContracts.length);
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(notifyUsers).toHaveBeenCalled();
      expect(updated).toEqual(sampleDoc);
    });

    it('throws if account invalid', async () => {
      (DocumentModel.getById as jest.Mock).mockResolvedValue(sampleDoc);
      await expect(DocumentService.updateDocument(1, {}, undefined as any, 'mintDocument')).rejects.toThrow('Address missing or invalid');
      await expect(DocumentService.updateDocument(1, {}, null as any, 'mintDocument')).rejects.toThrow('Address missing or invalid');
      await expect(DocumentService.updateDocument(1, {}, '', 'mintDocument')).rejects.toThrow('Address missing or invalid');
    });

    it('defaults txHash to empty string if undefined', async () => {
      await DocumentService.updateDocument(sampleDoc.tokenId, {}, MOCK_ADDRESS_1, 'reviewDocument', undefined);
      expect(DocumentModel.addLog).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ txHash: '' }));
    });

    // -------------------- signer logic --------------------
    it('uses existing.signer if present', async () => {
      const existingWithSigner = { ...sampleDoc, signer: MOCK_ADDRESS_3 };
      (DocumentModel.getById as jest.Mock).mockResolvedValue(existingWithSigner);

      await DocumentService.updateDocument(sampleDoc.tokenId, { name: 'Updated' } as any, MOCK_ADDRESS_1, 'reviewDocument');

      expect(DocumentModel.addLog).toHaveBeenCalledWith(
        sampleDoc.tokenId,
        expect.objectContaining({ signer: MOCK_ADDRESS_3, account: MOCK_ADDRESS_1 })
      );
    });

    it('defaults to normalized account if existing.signer null', async () => {
      const existingWithoutSigner = { ...sampleDoc, signer: null };
      (DocumentModel.getById as jest.Mock).mockResolvedValue(existingWithoutSigner);

      await DocumentService.updateDocument(sampleDoc.tokenId, { name: 'Updated' } as any, MOCK_ADDRESS_1, 'reviewDocument');

      expect(DocumentModel.addLog).toHaveBeenCalledWith(
        sampleDoc.tokenId,
        expect.objectContaining({ signer: MOCK_ADDRESS_1, account: MOCK_ADDRESS_1 })
      );
    });
  });

  // -------------------- deleteDocument --------------------
  describe('deleteDocument', () => {
    it('returns false if document not found', async () => {
      (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
      const res = await DocumentService.deleteDocument(999, MOCK_ADDRESS_1, 'revokeDocument');
      expect(res).toBe(false);
    });

    it('returns false if delete fails', async () => {
      (DocumentModel.delete as jest.Mock).mockResolvedValue(false);
      const res = await DocumentService.deleteDocument(sampleDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument');
      expect(res).toBe(false);
    });

    it('logs, notifies, returns true on success', async () => {
      const res = await DocumentService.deleteDocument(sampleDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument', '0xTxDel');
      expect(DocumentModel.addLog).toHaveBeenCalledTimes(sampleDoc.linkedContracts.length);
      expect(notifyWithAdmins).toHaveBeenCalled();
      expect(notifyUsers).toHaveBeenCalledWith([], expect.any(Object), expect.any(String));
      expect(res).toBe(true);
    });

    it('defaults txHash to empty string if undefined', async () => {
      await DocumentService.deleteDocument(sampleDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument', undefined);
      expect(DocumentModel.addLog).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ txHash: '' }));
    });
  });

  // -------------------- retrieval helpers --------------------
  describe('retrieval methods', () => {
    it('getAllDocuments attaches history', async () => {
      (DocumentModel.getAll as jest.Mock).mockResolvedValue([sampleDoc, { ...sampleDoc, tokenId: 2 }]);
      (DocumentModel.getLogs as jest.Mock).mockImplementation(async (tokenId: number) => [{ action: `log-${tokenId}` }]);
      const res = await DocumentService.getAllDocuments();
      expect(res).toHaveLength(2);
      expect(res[0].history[0]).toEqual({ action: 'log-1' });
      expect(res[1].history[0]).toEqual({ action: 'log-2' });
    });

    it('getDocumentById returns null if missing, doc+history if exists', async () => {
      (DocumentModel.getById as jest.Mock).mockResolvedValueOnce(null);
      expect(await DocumentService.getDocumentById(999)).toBeNull();

      (DocumentModel.getById as jest.Mock).mockResolvedValueOnce(sampleDoc);
      (DocumentModel.getLogs as jest.Mock).mockResolvedValueOnce([{ action: 'a' }]);
      const found = await DocumentService.getDocumentById(sampleDoc.tokenId);
      expect(found?.history).toEqual([{ action: 'a' }]);
    });

    it('getDocumentsByOwner returns documents with history', async () => {
      (DocumentModel.getLogs as jest.Mock).mockResolvedValue([{ action: 'owner-log' }]);
      const res = await DocumentService.getDocumentsByOwner(MOCK_ADDRESS_1);
      expect(res[0].history[0]).toEqual({ action: 'owner-log' });
    });

    it('getDocumentsByContract returns documents with history', async () => {
      (DocumentModel.getLogs as jest.Mock).mockResolvedValue([{ action: 'contract-log' }]);
      const res = await DocumentService.getDocumentsByContract(MOCK_ADDRESS_2);
      expect(res[0].history[0]).toEqual({ action: 'contract-log' });
    });

    it('normalizes null/undefined history to null', async () => {
      (DocumentModel.getLogs as jest.Mock).mockResolvedValueOnce(null);
      const allDocs = await DocumentService.getAllDocuments();
      expect(allDocs[0].history).toBeNull();
    });
  });

  // -------------------- recipientsToNotify logic --------------------
  describe('recipientsToNotify', () => {
    it('createDocument ignores null roles', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({ importer: null, exporter: MOCK_ADDRESS_2, logistics: null });
      await DocumentService.createDocument(
        { linkedContracts: [MOCK_ADDRESS_4], tokenId: 777, signer: MOCK_ADDRESS_3 } as any,
        MOCK_ADDRESS_2,
        'mintDocument'
      );
      expect(notifyUsers).toHaveBeenCalledWith([], expect.any(Object), MOCK_ADDRESS_2);
    });

    it('updateDocument ignores null roles', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({ importer: null, exporter: MOCK_ADDRESS_2, logistics: null });
      await DocumentService.updateDocument(
        1,
        { linkedContracts: [MOCK_ADDRESS_4], tokenId: 777 } as any,
        MOCK_ADDRESS_2,
        'mintDocument'
      );
      expect(notifyUsers).toHaveBeenCalledWith([], expect.any(Object), MOCK_ADDRESS_2);
    });

    it('ignores duplicate roles', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({ importer: MOCK_ADDRESS_2, exporter: null, logistics: null });

      await DocumentService.createDocument(
        { linkedContracts: [MOCK_ADDRESS_4], tokenId: 777, signer: MOCK_ADDRESS_3 } as any,
        MOCK_ADDRESS_2,
        'mintDocument'
      );

      expect(notifyUsers).toHaveBeenCalledWith([], expect.any(Object), MOCK_ADDRESS_2);
    });
    
    it('should include logistics in recipientsToNotify on updateDocument', async () => {
      (getContractRoles as jest.Mock).mockResolvedValue({
        importer: null,
        exporter: null,
        logistics: MOCK_ADDRESS_3,
      });

      await DocumentService.updateDocument(
        1,
        { linkedContracts: [MOCK_ADDRESS_4] } as any,
        MOCK_ADDRESS_1,
        'reviewDocument'
      );

      expect(notifyUsers).toHaveBeenCalledWith(
        expect.arrayContaining([MOCK_ADDRESS_3]),
        expect.any(Object),
        MOCK_ADDRESS_1
      );
    });
  });
});
