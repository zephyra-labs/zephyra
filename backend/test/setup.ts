/**
 * @file setup.ts
 * @description Global Jest setup for backend testing (TypeScript + Node)
 */

import dotenv from "dotenv";

/** --- Load environment variables for test --- */
dotenv.config({ path: ".env.test" });

/** --- Default environment values --- */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret";
process.env.FIREBASE_PROJECT_ID ||= "demo-project";

/** --- Global Mocks --- */

/** Mock notification helper */
jest.mock("<rootDir>/src/utils/notificationHelper", () => ({
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
}));

/** Mock UserModel */
jest.mock("<rootDir>/src/models/userModel", () => ({
  UserModel: {
    create: jest.fn(),
    getByAddress: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

/** --- Silence console logs during test runs --- */
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

/** --- Cleanup after each test --- */
afterEach(() => {
  // Clear all mocks to reset call counts
  jest.clearAllMocks();

  // Clear all timers (setTimeout, setInterval, setImmediate)
  jest.clearAllTimers();

  // Optionally restore spies if you use jest.spyOn in tests
  jest.restoreAllMocks();
});

/** --- Cleanup after all tests --- */
afterAll(async () => {
  // Restore console mocks
  jest.restoreAllMocks();

  // Close DB connections if you have any
  // Example: await db.disconnect();

  // Close any servers if started in tests
  // Example: server?.close();

  // Clear remaining timers just in case
  jest.clearAllTimers();
});
