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

// --- Global Mocks ---

// Mock UserModel
jest.mock("@/models/UserModel", () => ({
  UserModel: {
    create: jest.fn(),
    getByAddress: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock notification helper
jest.mock("@/utils/notificationHelper", () => ({
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
}));

// --- Mock Firebase Admin / Firestore ---
jest.mock("firebase-admin", () => {
  const actualAdmin = jest.requireActual("firebase-admin");
  const mockCollection = jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      update: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    }),
    add: jest.fn().mockResolvedValue({ id: "mock-id" }),
    get: jest.fn().mockResolvedValue({
      docs: [],
      empty: true,
    }),
  });

  const mockFirestore = jest.fn(() => ({
    collection: mockCollection,
    settings: jest.fn(),
  }));

  return {
    ...actualAdmin,
    initializeApp: jest.fn(),
    firestore: mockFirestore,
    credential: {
      cert: jest.fn(),
    },
  };
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
  jest.restoreAllMocks();
});

// --- Final cleanup ---
afterAll(async () => {
  jest.restoreAllMocks();
  jest.clearAllTimers();
  // await db.disconnect?.();
  // server?.close?.();
});
