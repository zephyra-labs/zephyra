/**
 * @file firebase.ts
 * @description Firebase Admin SDK initialization for Firestore.
 * Provides a single Firestore instance for backend usage.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

let serviceAccount: admin.ServiceAccount | undefined;

// Only initialize serviceAccount if not in test
if (process.env.NODE_ENV !== "test") {
  if (process.env.FIREBASE_CREDENTIALS) {
    // Parse JSON string from environment variable (CI)
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } else {
    // Fallback local file (development)
    const serviceAccountPath = path.resolve(__dirname, "./firebaseServiceAccount.json");
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
  }
}

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} 

// Firestore instance
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export { db };
export default admin;
