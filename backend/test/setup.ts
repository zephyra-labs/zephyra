/**
 * @file setup.ts
 * @description Global Jest setup for backend testing (TypeScript + Node), fully typed and lint-clean
 */

import dotenv from "dotenv";
import { resolve } from "path";

// --- Fix path aliases for Jest + GitHub Actions ---
const appRoot = resolve(__dirname, "../src");
process.env.NODE_PATH = appRoot;

// Node module path fix (optional, dynamic safe)
const nodeModule = require("module") as { _initPaths?: () => void };
if (typeof nodeModule._initPaths === "function") {
  nodeModule._initPaths();
}

// --- Load environment variables ---
dotenv.config({ path: ".env.test" });

// --- Default environment values ---
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret";
process.env.FIREBASE_PROJECT_ID ||= "demo-project";
process.env.GOOGLE_CLOUD_PROJECT ||= "demo-project";
process.env.FIRESTORE_EMULATOR_HOST ||= "localhost:8080";

// --- Global Mocks ---

interface UserData {
  address: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UserModelMock {
  create: (user: UserData) => Promise<UserData>;
  getByAddress: (address: string) => UserData | null;
  getAll: () => UserData[];
  update: (address: string, data: Partial<UserData>) => UserData | null;
  delete: (address: string) => boolean;
  __dataStore: Record<string, UserData>;
}

jest.mock("@/models/userModel", () => {
  const dataStore: Record<string, UserData> = {};

  const mockUserModel: UserModelMock = {
    create: jest.fn((user: UserData) => {
      if (dataStore[user.address]) {
        return Promise.reject(new Error(`User with address ${user.address} already exists`));
      }
      dataStore[user.address] = user;
      return Promise.resolve(user);
    }),
    getByAddress: jest.fn((address: string) => dataStore[address] || null),
    getAll: jest.fn(() => Object.values(dataStore)),
    update: jest.fn((address: string, data: Partial<UserData>) => {
      if (!dataStore[address]) return null;
      dataStore[address] = {
        ...dataStore[address],
        ...data,
        metadata: {
          ...dataStore[address].metadata,
          ...data.metadata,
        },
      };
      return dataStore[address];
    }),
    delete: jest.fn((address: string) => {
      if (!dataStore[address]) return false;
      delete dataStore[address];
      return true;
    }),
    __dataStore: dataStore,
  };

  return { UserModel: mockUserModel };
});

// --- Silence console logs ---
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

// --- Cleanup after each test ---
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Reset mock data store
  const { UserModel } = jest.requireMock("@/models/userModel") as { UserModel: UserModelMock };
  for (const key of Object.keys(UserModel.__dataStore)) {
    delete UserModel.__dataStore[key];
  }
});

// --- Final cleanup ---
afterAll(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
