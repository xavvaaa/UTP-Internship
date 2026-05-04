import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function normalizePrivateKey(serviceAccount) {
  if (!serviceAccount || typeof serviceAccount.private_key !== 'string') return serviceAccount
  return {
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  }
}

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  const clean = String(raw).trim()
  if (!clean) return null

  try {
    return normalizePrivateKey(JSON.parse(clean))
  } catch (initialError) {
    try {
      return normalizePrivateKey(JSON.parse(clean.replace(/\r?\n/g, '\\\\n')))
    } catch (fallbackError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', initialError.message, '|', fallbackError.message)
      return null
    }
  }
}

function initFirebaseAdmin() {
  if (getApps().length) return getApps()[0]

  const serviceAccount = parseServiceAccount()
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    })
  }

  console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not found or invalid; falling back to applicationDefault()')
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}

const app = initFirebaseAdmin()
export const adminDb = getFirestore(app)
export const adminAuth = getAuth(app)
