import admin from 'firebase-admin'
import path from 'path'

const serviceAccountPath = path.resolve('./src/firebaseServiceAccount.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  })
}

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true });

export { db }
export default admin
