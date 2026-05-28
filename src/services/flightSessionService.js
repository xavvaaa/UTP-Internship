/**
 * Flight Session API — flight_instance_id is the Firestore document id.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * POST /api/session/resolve
 */
export async function resolveSessionByCode(accessCode) {
  try {
    const code = String(accessCode ?? '').trim().toUpperCase()
    if (!code) {
      return { ok: false, error: 'access_code is required' }
    }
    const response = await fetch(`${API_URL}/session/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: code }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.status === 404) {
      return { ok: false, error: data.error || 'Session not found', notFound: true }
    }
    if (response.status === 410) {
      return { ok: false, error: data.error || 'Session has expired', expired: true }
    }
    if (response.status === 403) {
      return { ok: false, error: data.error || 'Session is not active' }
    }
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to resolve session' }
    }
    return {
      ok: true,
      flight_instance_id: data.flight_instance_id,
      session: data.session,
    }
  } catch (e) {
    console.error('resolveSessionByCode', e)
    return { ok: false, error: 'Network error' }
  }
}

/**
 * POST /api/session/:id/join-passenger
 */
export async function joinPassengerSession(flightInstanceId, seatNumber) {
  try {
    const id = String(flightInstanceId ?? '').trim()
    const seat = String(seatNumber ?? '').trim()
    if (!id || !seat) {
      return { ok: false, error: 'Flight instance and seat are required' }
    }
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(id)}/join-passenger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seat_number: seat }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.status === 404) {
      return { ok: false, error: data.error || 'Session not found' }
    }
    if (response.status === 410) {
      return { ok: false, error: data.error || 'Session has expired', expired: true }
    }
    if (response.status === 403) {
      return { ok: false, error: data.error || 'Session is not active' }
    }
    if (response.status === 409) {
      return { ok: false, error: data.error || 'Seat is already occupied', conflict: true }
    }
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to join session' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    console.error('joinPassengerSession', e)
    return { ok: false, error: 'Network error' }
  }
}

/**
 * GET /api/session/summary?scope=global|filtered&flight_number&date
 */
export async function getSessionSummary(token, query = {}) {
  try {
    const params = new URLSearchParams()
    if (query.scope) params.set('scope', query.scope)
    if (query.flight_number) params.set('flight_number', query.flight_number)
    if (query.date) params.set('date', query.date)
    const q = params.toString()
    const response = await fetch(`${API_URL}/session/summary${q ? `?${q}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to load session summary' }
    }
    return {
      ok: true,
      active: data.active ?? [],
      endedRecent: data.ended_recent ?? [],
      scope: data.scope,
    }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

/**
 * PATCH /api/session/:id/end
 */
export async function endSession(sessionId, token) {
  try {
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(sessionId)}/end`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to end session' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

/**
 * Get all sessions (auth) — optional fallback
 */
export async function getAllSessions(token) {
  try {
    const response = await fetch(`${API_URL}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to fetch sessions' }
    }
    return { ok: true, sessions: data.sessions }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

/**
 * Create session (auth)
 */
export async function createSession(sessionData, token) {
  try {
    const response = await fetch(`${API_URL}/session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to create session' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

export async function lookupFlightRoute(flightNumber, date, token) {
  try {
    const params = new URLSearchParams({
      flight_number: String(flightNumber ?? '').trim().toUpperCase(),
      date: String(date ?? '').trim(),
    })
    const response = await fetch(`${API_URL}/session/route-lookup?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to look up route' }
    }
    return {
      ok: true,
      route: data.route,
      departure: data.departure,
      arrival: data.arrival,
      departure_time: data.departure_time,
      flight_date: data.flight_date,
      source: data.source,
    }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

/**
 * Get session by id (validates; 404/410/403)
 */
export async function getSessionById(sessionId) {
  try {
    if (!sessionId?.trim()) {
      return { ok: false, error: 'Session ID is required' }
    }
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(sessionId)}`)
    const data = await response.json().catch(() => ({}))
    if (response.status === 404) {
      return { ok: false, error: data.error || 'Session not found' }
    }
    if (response.status === 410) {
      return { ok: false, error: data.error || 'Session has expired', expired: true, session: data.session }
    }
    if (response.status === 403) {
      return { ok: false, error: data.error || 'Session is not active' }
    }
    if (!response.ok) {
      return { ok: false, error: data.error || 'Session not found' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

export async function checkSeatAvailability(sessionId, seatNumber) {
  try {
    if (!sessionId?.trim() || !seatNumber?.trim()) {
      return { ok: false, error: 'Session and seat are required' }
    }
    const response = await fetch(
      `${API_URL}/session/${encodeURIComponent(sessionId)}/seat/${encodeURIComponent(seatNumber)}/available`,
    )
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to check seat' }
    }
    return { ok: true, available: data.available, seatNumber: data.seatNumber }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

export async function deleteSession(sessionId, token) {
  try {
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to delete session' }
    }
    return { ok: true, message: data.message }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

export async function updateSession(sessionId, updates, token) {
  try {
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(sessionId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    const data = await response.json()
    if (response.status === 409) {
      return { ok: false, error: data.error, duplicate: true }
    }
    if (response.status === 410) {
      return { ok: false, error: data.error, expired: true }
    }
    if (response.status === 403) {
      return { ok: false, error: data.error }
    }
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update session' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}

export async function assignCrewToSession(sessionId, crewIds, token) {
  try {
    const response = await fetch(`${API_URL}/session/${encodeURIComponent(sessionId)}/assign-crew`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ crew_ids: crewIds }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to assign crew' }
    }
    return { ok: true, session: data.session }
  } catch (e) {
    return { ok: false, error: 'Network error' }
  }
}
