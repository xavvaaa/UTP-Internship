/**
 * Hook to read and update passenger session state.
 */
import { useContext } from 'react'
import { SessionContext } from './sessionContext'

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
