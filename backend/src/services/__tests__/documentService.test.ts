/**
 * @file documentService.test.ts
 * @description Unit tests for DocumentService using Jest with valid Ethereum addresses.
 */

import { DocumentService } from '../documentService';
import { DocumentModel } from '../../models/documentModel';
import { notifyWithAdmins, notifyUsers } from '../../utils/notificationHelper';
import { getContractRoles } from '../../utils/getContractRoles';
import type { Document, DocType, DocumentStatus } from '../../types/Document';

// --- Mock dependencies ---
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

// --- Dummy Ethereum addresses ---
const MOCK_ADDRESS_1 = '0x1111111111111111111111111111111111111111';
const MOCK_ADDRESS_2 = '0x2222222222222222222222222222222222222222';
const MOCK_ADDRESS_3 = '0x3333333333333333333333333333333333333333';
const MOCK_ADDRESS_4 = '0x4444444444444444444444444444444444444444';

const docType: DocType = 'Invoice';
const docStatus: DocumentStatus = 'Draft';

describe('DocumentService', () => {
  const mockDoc: Document = {
    tokenId: 1,
    owner: MOCK_ADDRESS_1,
    fileHash: '0xHash',
    uri: 'https://example.com/doc.pdf',
    docType,
    linkedContracts: [MOCK_ADDRESS_2],
    status: docStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    signer: MOCK_ADDRESS_3,
    name: 'Test Document',
    description: 'Test description',
  };

  const mockRoles = { importer: MOCK_ADDRESS_1, exporter: MOCK_ADDRESS_2, logistics: MOCK_ADDRESS_3 };

  beforeEach(() => {
    jest.clearAllMocks();
    (getContractRoles as jest.Mock).mockResolvedValue(mockRoles);
    (DocumentModel.create as jest.Mock).mockResolvedValue(mockDoc);
    (DocumentModel.update as jest.Mock).mockResolvedValue(mockDoc);
    (DocumentModel.delete as jest.Mock).mockResolvedValue(true);
    (DocumentModel.getById as jest.Mock).mockResolvedValue(mockDoc);
    (DocumentModel.getLogs as jest.Mock).mockResolvedValue([]);
  });

  // -------------------- createDocument --------------------
  it('should create a document and notify', async () => {
    const data = { ...mockDoc };
    const result = await DocumentService.createDocument(data, MOCK_ADDRESS_1, 'mintDocument', '0xTx');

    expect(DocumentModel.create).toHaveBeenCalled();
    expect(DocumentModel.addLog).toHaveBeenCalledTimes(1);
    expect(notifyWithAdmins).toHaveBeenCalled();
    expect(notifyUsers).toHaveBeenCalled();
    expect(result).toEqual(mockDoc);
  });

  it('should throw if no linked contracts', async () => {
    const data = { ...mockDoc, linkedContracts: [] };
    await expect(DocumentService.createDocument(data, MOCK_ADDRESS_1, 'mintDocument'))
      .rejects.toThrow('Document must link to at least one contract');
  });

  it('should throw if account not authorized for contract', async () => {
    (getContractRoles as jest.Mock).mockResolvedValue({ importer: MOCK_ADDRESS_4, exporter: '', logistics: '' });
    const data = { ...mockDoc };
    await expect(DocumentService.createDocument(data, MOCK_ADDRESS_1, 'mintDocument'))
      .rejects.toThrow(`Unauthorized account for ${MOCK_ADDRESS_2}`);
  });

  // -------------------- updateDocument --------------------
  it('should update a document and notify', async () => {
    const data = { signer: MOCK_ADDRESS_3 };
    const result = await DocumentService.updateDocument(mockDoc.tokenId, data, MOCK_ADDRESS_1, 'reviewDocument', '0xTx');

    expect(DocumentModel.update).toHaveBeenCalled();
    expect(DocumentModel.addLog).toHaveBeenCalled();
    expect(notifyWithAdmins).toHaveBeenCalled();
    expect(notifyUsers).toHaveBeenCalled();
    expect(result).toEqual(mockDoc);
  });

  it('should throw if document not found for update', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
    await expect(DocumentService.updateDocument(99, {}, MOCK_ADDRESS_1, 'reviewDocument'))
      .rejects.toThrow('Document 99 not found');
  });

  // -------------------- deleteDocument --------------------
  it('should delete a document and notify', async () => {
    const result = await DocumentService.deleteDocument(mockDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument', '0xTx');

    expect(DocumentModel.delete).toHaveBeenCalledWith(mockDoc.tokenId);
    expect(DocumentModel.addLog).toHaveBeenCalled();
    expect(notifyWithAdmins).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return false if document not found for delete', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
    const result = await DocumentService.deleteDocument(99, MOCK_ADDRESS_1, 'revokeDocument');
    expect(result).toBe(false);
  });

  it('should return false if delete fails', async () => {
    (DocumentModel.delete as jest.Mock).mockResolvedValue(false);
    const result = await DocumentService.deleteDocument(mockDoc.tokenId, MOCK_ADDRESS_1, 'revokeDocument');
    expect(result).toBe(false);
  });

  // -------------------- getAllDocuments --------------------
  it('should get all documents with logs', async () => {
    (DocumentModel.getAll as jest.Mock).mockResolvedValue([mockDoc]);
    const result = await DocumentService.getAllDocuments();
    expect(result[0]).toHaveProperty('history');
  });

  // -------------------- getDocumentById --------------------
  it('should get document by id with logs', async () => {
    const result = await DocumentService.getDocumentById(mockDoc.tokenId);
    expect(result).toHaveProperty('history');
  });

  it('should return null if document not found by id', async () => {
    (DocumentModel.getById as jest.Mock).mockResolvedValue(null);
    const result = await DocumentService.getDocumentById(99);
    expect(result).toBeNull();
  });

  // -------------------- getDocumentsByOwner --------------------
  it('should get documents by owner with logs', async () => {
    (DocumentModel.getByOwner as jest.Mock).mockResolvedValue([mockDoc]);
    const result = await DocumentService.getDocumentsByOwner(MOCK_ADDRESS_1);
    expect(result[0]).toHaveProperty('history');
  });

  // -------------------- getDocumentsByContract --------------------
  it('should get documents by contract with logs', async () => {
    (DocumentModel.getByContract as jest.Mock).mockResolvedValue([mockDoc]);
    const result = await DocumentService.getDocumentsByContract(MOCK_ADDRESS_2);
    expect(result[0]).toHaveProperty('history');
  });
});
