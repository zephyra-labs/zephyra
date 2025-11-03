/**
 * @file setup.ts
 * @description Global Jest setup for backend testing (TypeScript + Node)
 * This file handles:
 *   1. Loading environment variables for test
 *   2. Setting default env values for tests
 *   3. Initializing global mocks
 *   4. Silencing console output during test runs
 */

import dotenv from "dotenv";

/**
 * --- Load environment variables ---
 * Uses `.env.test` specifically for testing environment.
 */
dotenv.config({ path: ".env.test" });

/**
 * --- Set default environment values for tests ---
 * These are fallbacks if not defined in .env.test
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "demo-project";

/**
 * --- Global Mocks ---
 * Mocks modules that are used throughout tests to prevent
 * actual external calls and side effects.
 */

/**
 * Mock notification helper
 * @module notificationHelper
 */
jest.mock("../src/utils/notificationHelper", () => ({
  /**
   * Mocked function for notifying admins
   * @returns {Promise<boolean>} Always resolves true in tests
   */
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
}));

/**
 * Mock UserModel
 * @module userModel
 */
jest.mock("../src/models/userModel", () => ({
  UserModel: {
    /**
     * Mock create user
     */
    create: jest.fn(),
    /**
     * Mock get user by address
     */
    getByAddress: jest.fn(),
    /**
     * Mock get all users
     */
    getAll: jest.fn(),
    /**
     * Mock update user
     */
    update: jest.fn(),
    /**
     * Mock delete user
     */
    delete: jest.fn(),
  },
}));

/**
 * --- Silence console logs during test runs ---
 * Prevents noisy console output from polluting test results
 */
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

/**
 * --- Restore console mocks after all tests ---
 */
afterAll(() => {
  jest.restoreAllMocks();
});
