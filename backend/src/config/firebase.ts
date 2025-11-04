/**
 * @file firebase.ts
 * @description Firebase Admin SDK initialization for Firestore.
 * Provides a single Firestore instance for backend usage.
 * Automatically skips initialization in test environment.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

let db: FirebaseFirestore.Firestore;

if (process.env.NODE_ENV === "test") {
  // In Jest tests, provide a dummy Firestore object to avoid initialization errors
  db = {} as FirebaseFirestore.Firestore;
} else {
  let serviceAccount: admin.ServiceAccount;

  if (process.env.FIREBASE_CREDENTIALS) {
    // Parse JSON from environment variable (CI/CD friendly)
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } else {
    // Fallback to local JSON file for development
    const serviceAccountPath = path.resolve(__dirname, "./firebaseServiceAccount.json");
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
  }

  // Initialize Firebase Admin SDK only once
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
}

export { db };
export default admin;
