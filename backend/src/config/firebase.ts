/**
 * @file firebase.ts
 * @description Firebase Admin SDK initialization for Firestore.
 * Provides a single Firestore instance for backend usage.
 */

import admin from 'firebase-admin'
import path from 'path'

/**
 * @constant {string}
 * @description Path to Firebase service account JSON file
 */
const serviceAccountPath = process.env.FIREBASE_ADMIN_JSON
  ? path.resolve(process.env.FIREBASE_ADMIN_JSON)
  : null;

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccountPath
      ? admin.credential.cert(serviceAccountPath)
      : admin.credential.applicationDefault(),
  });
}

/**
 * @constant {FirebaseFirestore.Firestore}
 * @description Firestore database instance
 */
const db = admin.firestore()

// Ensure undefined properties are ignored in Firestore writes
db.settings({ ignoreUndefinedProperties: true })

export { db }
export default admin
