/**
 * Firebase Auth session + RBAC role state for admin dashboard.
 * Flight assignment uses SessionProvider flightInstanceId (crew joins via access_code).
 */
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [flightId, setFlightId] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshClaims = useCallback(async (currentUser) => {
    if (!currentUser) {
      setRole(null)
      setFlightId(null)
      return { role: null, flightId: null }
    }
    try {
      const tokenResult = await currentUser.getIdTokenResult(true)
      const claimRole = String(tokenResult?.claims?.role ?? '').toLowerCase()
      const claimFlightId = String(tokenResult?.claims?.flightId ?? '').trim()
      setRole(claimRole || null)
      setFlightId(claimFlightId || null)
      return { role: claimRole || null, flightId: claimFlightId || null }
    } catch (error) {
      console.warn('Failed to refresh auth claims (network or certificate issue):', error.message)
      // Set fallback values to prevent app crashes
      setRole(null)
      setFlightId(null)
      return { role: null, flightId: null }
    }
  }, [])

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return () => {}
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      try {
        await refreshClaims(nextUser)
      } finally {
        setLoading(false)
      }
    })
  }, [refreshClaims])

  const signIn = useCallback(
    async (email, password, options = {}) => {
      if (!auth) throw new Error('Firebase Auth is not configured.')
      const persistence = options.rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const claims = await refreshClaims(cred.user)
      return { user: cred.user, ...claims }
    },
    [refreshClaims],
  )

  const signOutUser = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
    setRole(null)
    setFlightId(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      flightId,
      loading,
      signIn,
      signOut: signOutUser,
      hasRole: (allowed) => {
        if (!role) return false
        return Array.isArray(allowed) ? allowed.includes(role) : allowed === role
      },
    }),
    [user, role, flightId, loading, signIn, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
