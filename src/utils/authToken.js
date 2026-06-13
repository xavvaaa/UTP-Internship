/**
 * Auth Token Utility
 * Helper function to get Firebase auth token
 */
import { getAuth } from 'firebase/auth'

/**
 * Get the current user's ID token from Firebase Auth
 * @returns {Promise<string>} The ID token
 * @throws {Error} If user is not authenticated
 */
export async function getAuthToken() {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Force refresh to get the latest token with custom claims
    const idTokenResult = await currentUser.getIdTokenResult(true)
    return idTokenResult.token
  } catch (error) {
    console.error('Failed to get auth token:', error)
    throw error
  }
}
