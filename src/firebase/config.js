/**
 * Firebase app + Firestore singleton; skips init when env is incomplete.
 * Includes network error handling for development environments.
 */
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'

// Network error wrapper for Firebase operations
function withNetworkErrorHandling(operation, fallbackValue = null) {
  try {
    return operation()
  } catch (error) {
    if (error.message?.includes('network') || error.message?.includes('certificate') || error.message?.includes('ERR_CERT_AUTHORITY_INVALID')) {
      console.warn('Firebase network/certificate error detected. This is common in development environments.')
      return fallbackValue
    }
    throw error
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const configured = Object.values(firebaseConfig).every(Boolean)

let app = null
if (configured) {
  app = withNetworkErrorHandling(() => {
    return getApps().length ? getApp() : initializeApp(firebaseConfig)
  }, null)
}

export const firebaseConfigured = configured
export const db = app ? withNetworkErrorHandling(() => getFirestore(app), null) : null
export const storage = app ? withNetworkErrorHandling(() => getStorage(app), null) : null
export const auth = app ? withNetworkErrorHandling(() => getAuth(app), null) : null

// Set auth persistence to session-only (user must log in again when tab is closed)
if (auth) {
  try {
    setPersistence(auth, browserSessionPersistence)
  } catch (error) {
    console.warn('Failed to set Firebase auth persistence:', error.message)
  }
}
