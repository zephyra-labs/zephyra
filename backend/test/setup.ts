/**
 * @file setup.ts
 * @description Global Jest setup for backend testing (TypeScript + Node)
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { Module } from "module";

// --- Fix path aliases for Jest + GitHub Actions ---
const appRoot = resolve(__dirname, "../src");
process.env.NODE_PATH = appRoot;
(Module as any)._initPaths();

// --- Load environment variables ---
dotenv.config({ path: ".env.test" });

// --- Default environment values ---
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret";
process.env.FIREBASE_PROJECT_ID ||= "demo-project";
process.env.GOOGLE_CLOUD_PROJECT ||= "demo-project";
process.env.FIRESTORE_EMULATOR_HOST ||= "localhost:8080";

// --- Global Mocks ---
// Mock UserModel
jest.mock("@/models/userModel", () => {
  const dataStore: Record<string, any> = {};

  const mockUserModel = {
    create: jest.fn((user) => {
      if (dataStore[user.address])
        return Promise.reject(new Error(`User with address ${user.address} already exists`));
      dataStore[user.address] = user;
      return user;
    }),
    getByAddress: jest.fn((address) => dataStore[address] || null),
    getAll: jest.fn(() => Object.values(dataStore)),
    update: jest.fn((address, data) => {
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
    delete: jest.fn((address) => {
      if (!dataStore[address]) return false;
      delete dataStore[address];
      return true;
    }),
    __dataStore: dataStore,
  };

  return { UserModel: mockUserModel };
});

// Mock notification helper
jest.mock("@/utils/notificationHelper", () => ({
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
}));

// Mock getContractRoles
jest.mock("@/utils/getContractRoles", () => ({
  getContractRoles: jest.fn().mockResolvedValue({
    exporter: "0xuser1",
    importer: "0xuser2",
    logistics: ["0xuser3"],
  }),
}));

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
  const { UserModel } = jest.requireMock("@/models/userModel");
  for (const key of Object.keys(UserModel.__dataStore)) {
    delete UserModel.__dataStore[key];
  }
});

// --- Final cleanup ---
afterAll(async () => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
