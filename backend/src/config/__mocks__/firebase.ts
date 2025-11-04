/**
 * Mock Firestore document
 */
const mockDoc = () => ({
  set: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

/**
 * Mock Firestore collection
 */
const mockCollection = () => ({
  doc: (id?: string) => mockDoc(),
  add: jest.fn(),
  get: jest.fn(),
  where: () => mockCollection(),
  orderBy: () => mockCollection(),
  limit: () => mockCollection(),
});

/**
 * Mock Firestore db
 */
export const db = {
  collection: (name: string) => mockCollection(),
} as any;

/**
 * Mock Firebase admin
 */
const admin = {
  apps: [],
  initializeApp: jest.fn(),
  firestore: () => db,
  credential: {
    cert: jest.fn(),
  },
};

export default admin;
