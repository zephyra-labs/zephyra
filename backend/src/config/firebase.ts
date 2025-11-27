/**
 * @file firebase.ts
 * @description Firebase Admin SDK initialization for Firestore.
 * Supports Windows/Linux, environment variable `FIREBASE_ADMIN_JSON`,
 * and falls back to applicationDefault() if the service account JSON is missing.
 */

import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

/**
 * @constant {string | undefined}
 * @description Path to Firebase service account JSON file from environment variable
 */
const serviceAccountEnv = process.env.FIREBASE_ADMIN_JSON

/**
 * @constant {string | null}
 * @description Absolute path to the service account JSON file
 */
const serviceAccountPath = serviceAccountEnv
  ? path.resolve(process.cwd(), serviceAccountEnv)
  : path.resolve(process.cwd(), './src/firebaseServiceAccount.json')

/**
 * @type {admin.credential.Credential}
 * @description Firebase Admin credential
 */
let credential: admin.credential.Credential

if (fs.existsSync(serviceAccountPath)) {
  // Jika file JSON ada, parse dan gunakan cert
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
  credential = admin.credential.cert(serviceAccount)
  console.log(`✅ Firebase Admin: Loaded service account from ${serviceAccountPath}`)
} else {
  // Fallback ke applicationDefault jika file tidak ada
  credential = admin.credential.applicationDefault()
  console.warn(
    `⚠️ Firebase Admin: Service account JSON not found at ${serviceAccountPath}. Using applicationDefault().`
  )
}

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
if (!admin.apps.length) {
  admin.initializeApp({ credential })
}

/**
 * @constant {FirebaseFirestore.Firestore}
 * @description Firestore database instance
 */
const db = admin.firestore()

// Pastikan undefined properties diabaikan saat menulis ke Firestore
db.settings({ ignoreUndefinedProperties: true })

export { db }
export default admin
