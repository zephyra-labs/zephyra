/**
 * @file firebase.ts
 * @description Jest mock for Firebase Admin SDK (Firestore), fully typed with JSDoc.
 */

import type { Firestore, CollectionReference, DocumentReference, Query, QuerySnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import type admin from 'firebase-admin';

/**
 * Creates a mock Firestore document reference
 * @returns {Partial<DocumentReference>} Mocked document reference
 */
const mockDoc = (): Partial<DocumentReference> => ({
  /** Mocked set function */
  set: jest.fn().mockResolvedValue(undefined),
  /** Mocked get function */
  get: jest.fn().mockResolvedValue({ exists: true, data: jest.fn() } as Partial<DocumentSnapshot>),
  /** Mocked update function */
  update: jest.fn().mockResolvedValue(undefined),
  /** Mocked delete function */
  delete: jest.fn().mockResolvedValue(undefined),
});

/**
 * Creates a mock Firestore collection or query chain
 * @returns {Partial<CollectionReference> & Partial<Query>} Mocked collection / query
 */
const mockCollection = (): Partial<CollectionReference> & Partial<Query> => ({
  /** Returns a mock document */
  doc: () => mockDoc() as DocumentReference,
  /** Mocked add function */
  add: jest.fn().mockResolvedValue(mockDoc() as DocumentReference),
  /** Mocked get function for collection or query */
  get: jest.fn().mockResolvedValue({
    docs: [],
    empty: true,
    forEach: jest.fn(),
  } as Partial<QuerySnapshot>),
  /** Mocked query chain methods */
  where: () => mockCollection() as CollectionReference & Query,
  orderBy: () => mockCollection() as CollectionReference & Query,
  limit: () => mockCollection() as CollectionReference & Query,
});

/**
 * Mock Firestore database
 */
export const db: Partial<Firestore> = {
  /** Returns a mocked collection reference */
  collection: () => mockCollection() as CollectionReference,
};

/**
 * Mock Firebase Admin SDK
 */
const adminMock: {
  apps: admin.app.App[];
  initializeApp: jest.Mock;
  firestore: () => typeof db;
  credential: { cert: jest.Mock };
} = {
  /** Mock initialized apps array */
  apps: [],
  /** Mock initializeApp function */
  initializeApp: jest.fn(),
  /** Returns mocked Firestore */
  firestore: () => db,
  /** Mock credential object */
  credential: {
    /** Mock cert function */
    cert: jest.fn(),
  },
};

export default adminMock;
