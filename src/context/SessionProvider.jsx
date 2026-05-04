/**
 * Flight session state: flight_instance_id (doc id), optional seat (passenger), role.
 * Persisted in localStorage for reload survival.
 */
import { useCallback, useMemo, useState } from 'react'
import { SessionContext } from './sessionContext'
import { getSessionById } from '../services/flightSessionService'

const ID_KEY = 'ifmod_flight_instance_id'
const SEAT_KEY = 'ifmod_seat_number'
const DATA_KEY = 'ifmod_session_data'
const ROLE_KEY = 'ifmod_session_role'

function readLs(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLs(key, value) {
  try {
    if (value == null || value === '') localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    /* ignore */
  }
}

export function SessionProvider({ children }) {
  const [sessionId, setSessionIdState] = useState(() => readLs(ID_KEY) || null)
  const [seatNumber, setSeatNumberState] = useState(() => readLs(SEAT_KEY) || null)
  const [sessionData, setSessionDataState] = useState(() => {
    try {
      const raw = readLs(DATA_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [sessionRole, setSessionRoleState] = useState(() => readLs(ROLE_KEY) || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setSessionId = useCallback((id) => {
    setSessionIdState(id)
    writeLs(ID_KEY, id)
  }, [])

  const setSessionData = useCallback((data) => {
    setSessionDataState(data)
    try {
      if (data) localStorage.setItem(DATA_KEY, JSON.stringify(data))
      else localStorage.removeItem(DATA_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const setSessionSeat = useCallback((seat) => {
    const normalized = String(seat ?? '').trim()
    setSeatNumberState(normalized || null)
    writeLs(SEAT_KEY, normalized || null)
  }, [])

  const setRole = useCallback((role) => {
    const r = role ? String(role).toLowerCase() : null
    setSessionRoleState(r)
    writeLs(ROLE_KEY, r)
  }, [])

  const clearSession = useCallback(() => {
    setSessionIdState(null)
    setSeatNumberState(null)
    setSessionDataState(null)
    setSessionRoleState(null)
    setError(null)
    writeLs(ID_KEY, null)
    writeLs(SEAT_KEY, null)
    writeLs(ROLE_KEY, null)
    try {
      localStorage.removeItem(DATA_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const setSession = useCallback(
    async ({
      sessionId: id,
      seatNumber: seat,
      sessionInfo = null,
      role = 'passenger',
    }) => {
      setLoading(true)
      setError(null)

      try {
        let fullSessionData = sessionInfo
        if (!fullSessionData && id) {
          const result = await getSessionById(id)
          if (result.ok) {
            fullSessionData = result.session
          } else {
            clearSession()
            setError(result.error || 'Session not found or no longer active')
            return false
          }
        }

        setSessionId(id)
        setRole(role)
        if (role === 'crew' || role === 'admin') {
          setSessionSeat(null)
          writeLs(SEAT_KEY, null)
        } else {
          setSessionSeat(seat ?? '')
        }
        setSessionData(fullSessionData)
        return true
      } catch (err) {
        setError(err?.message || 'Failed to set session')
        return false
      } finally {
        setLoading(false)
      }
    },
    [clearSession, setSessionId, setSessionSeat, setSessionData, setRole],
  )

  const isActive = sessionData?.status === 'active'
  const flightNumber = sessionData?.flightNumber || sessionData?.flight_number
  const route = sessionData?.route
  const departureTime = sessionData?.departureTime || sessionData?.departure_time
  const arrivalTime = sessionData?.arrivalTime || sessionData?.arrival_time

  const value = useMemo(
    () => ({
      sessionId,
      flightInstanceId: sessionId,
      seatNumber,
      sessionData,
      sessionRole,

      isActive,
      flightNumber,
      route,
      departureTime,
      arrivalTime,

      loading,
      error,

      setSessionId,
      setSessionSeat,
      setSession,
      setSessionData,
      setRole,
      clearSession,
    }),
    [
      sessionId,
      seatNumber,
      sessionData,
      sessionRole,
      isActive,
      flightNumber,
      route,
      departureTime,
      arrivalTime,
      loading,
      error,
      setSessionId,
      setSessionSeat,
      setSession,
      setSessionData,
      setRole,
      clearSession,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
