/**
 * @file setup.ts
 * @description Global Jest setup for backend testing (TypeScript + Node)
 * Handles environment setup, mock initialization, and process configuration.
 */

import dotenv from "dotenv";

// --- Load environment variables ---
dotenv.config({ path: ".env.test" });

// --- Set default env values for tests ---
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "demo-project";

// --- Global mocks (you can expand these) ---
jest.mock("../src/utils/notificationHelper.ts", () => ({
  notifyWithAdmins: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/models/userModel.ts", () => ({
  UserModel: {
    create: jest.fn(),
    getByAddress: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));