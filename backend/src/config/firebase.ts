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
const serviceAccountPath = path.resolve('./src/firebaseServiceAccount.json')

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  })
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
