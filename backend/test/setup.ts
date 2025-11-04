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

// Note: Match exact case with file names on Linux (e.g., UserModel.ts)
jest.mock("@/models/UserModel", () => ({
  UserModel: {
    create: jest.fn(),
    getByAddress: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/utils/notificationHelper", () => ({
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
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
  jest.restoreAllMocks();
});

// --- Final cleanup ---
afterAll(async () => {
  jest.restoreAllMocks();
  jest.clearAllTimers();

  // If using external resources:
  // await db.disconnect?.();
  // server?.close?.();
});
