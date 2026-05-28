/**
 * Flight Session Controller — flight_instance_id (doc id) is canonical.
 */
import { v4 as uuidv4 } from 'uuid'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb, adminAuth } from '../firebaseAdmin.js'

const COLLECTION = 'flight_sessions'

function formatDateForQuery(date) {
  if (!date) return null
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return String(date).split('T')[0]
}

/** Combined local date + departure_time → expires_at ISO (+6h) */
export function calculateExpiresAt(dateInput, departureTime) {
  const normalizedDate = formatDateForQuery(dateInput)
  if (!normalizedDate) return null
  const [y, mo, d] = normalizedDate.split('-').map(Number)
  const anchor = new Date(y, mo - 1, d)
  const timePart = departureTime || '00:00'
  const [hours, minutes] = String(timePart).split(':').map(Number)
  anchor.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0)
  const expirationTime = new Date(anchor.getTime() + 6 * 60 * 60 * 1000)
  return expirationTime.toISOString()
}

function normalizeSeat(seat) {
  return String(seat ?? '')
    .trim()
    .toUpperCase()
}

function parseFlightNumber(value) {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const match = normalized.match(/^([A-Z]{2,3})(\d+[A-Z]?)$/)
  if (!match) return { flightIata: normalized, airlineIata: '', number: normalized }
  return { flightIata: normalized, airlineIata: match[1], number: match[2] }
}

function readRouteFromItem(item) {
  const dep =
    item?.departure?.iata ||
    item?.departure?.iataCode ||
    item?.dep_iata ||
    item?.departure_iata
  const arr =
    item?.arrival?.iata ||
    item?.arrival?.iataCode ||
    item?.arr_iata ||
    item?.arrival_iata

  if (!dep || !arr) return null
  const departure = String(dep).toUpperCase()
  const arrival = String(arr).toUpperCase()
  const scheduled = item?.departure?.scheduled || item?.departure?.scheduledTime || ''
  const flightDate = item?.flight_date || ''
  const departureTime = scheduled ? String(scheduled).slice(11, 16) : ''
  return { route: `${departure}-${arrival}`, departure, arrival, departure_time: departureTime, flight_date: flightDate }
}

async function fetchAviationstack(path, params) {
  const key = process.env.AVIATIONSTACK_API_KEY
  if (!key) {
    const error = new Error('Aviationstack API key is not configured')
    error.status = 501
    throw error
  }

  const url = new URL(`https://api.aviationstack.com/v1/${path}`)
  url.searchParams.set('access_key', key)
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    if (paramValue) url.searchParams.set(paramKey, paramValue)
  })

  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.error) {
    const error = new Error(data?.error?.message || 'Aviationstack lookup failed')
    error.status = response.status || 502
    throw error
  }

  return Array.isArray(data?.data) ? data.data : []
}

function isPlanUnsupported(error) {
  return (
    error?.status === 403 &&
    String(error?.message || '').toLowerCase().includes('subscription plan')
  )
}

function isSessionExpired(data) {
  const expiresAt = data?.expires_at
  if (!expiresAt) return false
  return new Date() >= new Date(expiresAt)
}

function buildExpireUpdate(nowIso = new Date().toISOString()) {
  return {
    status: 'expired',
    ended_at: FieldValue.serverTimestamp(),
    updated_at: nowIso,
  }
}

/** Persist status=expired for active sessions past expires_at. Returns payloads marked expired. */
async function expireStaleActiveDocs(docs) {
  const nowIso = new Date().toISOString()
  const batch = adminDb.batch()
  const active = []
  const expired = []
  let writeCount = 0

  for (const doc of docs) {
    const data = doc.data()
    if (data.status !== 'active') continue

    if (isSessionExpired(data)) {
      batch.update(doc.ref, buildExpireUpdate(nowIso))
      writeCount++
      expired.push(safeSessionPayload(doc.id, { ...data, status: 'expired' }))
    } else {
      active.push(safeSessionPayload(doc.id, data))
    }
  }

  if (writeCount > 0) {
    await batch.commit()
  }

  return { active, expired }
}

async function expireSessionIfStale(ref, data) {
  if (data?.status === 'active' && isSessionExpired(data)) {
    await ref.update(buildExpireUpdate())
    return true
  }
  return false
}

function sortSessionsByEndedAt(docs) {
  return [...docs].sort((a, b) => {
    const aTime = a.data?.ended_at ? new Date(a.data.ended_at).getTime() : 0
    const bTime = b.data?.ended_at ? new Date(b.data.ended_at).getTime() : 0
    return bTime - aTime
  })
}

function mapEndedRecent(docs, limit = 5) {
  return sortSessionsByEndedAt(docs)
    .slice(0, limit)
    .map((d) => safeSessionPayload(d.id, d.data))
}

/** Validation order: 404 → 410 → 403 (no DB writes). Returns { ok } or { status, error } */
function validateSessionSnapshot(snap) {
  if (!snap.exists) return { status: 404, error: 'Session not found' }
  const data = snap.data()
  if (isSessionExpired(data)) {
    return { status: 410, error: 'Session has expired' }
  }
  if (data.status !== 'active') {
    return { status: 403, error: 'Session is not active' }
  }
  return { ok: true, data }
}

function safeSessionPayload(id, data) {
  return {
    id,
    session_id: id, // Add session_id field for frontend compatibility
    flight_number: data.flight_number ?? null,
    date: data.date ?? null,
    departure_time: data.departure_time ?? null,
    route: data.route ?? null,
    expires_at: data.expires_at ?? null,
    status: data.status ?? null,
    occupied_seats: data.occupied_seats ?? [],
    access_code: data.access_code ?? null,
    ended_at: data.ended_at ?? null,
    deleted_at: data.deleted_at ?? null,
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null,
    assigned_crew_ids: data.assigned_crew_ids ?? [],
  }
}

async function generateUniqueAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let attempt = 0; attempt < 80; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const existing = await adminDb.collection(COLLECTION).where('access_code', '==', code).limit(1).get()
    if (existing.empty) return code
  }
  throw new Error('Could not allocate a unique access_code')
}

/**
 * POST /api/session/resolve
 */
export async function resolveSession(req, res) {
  try {
    const code = String(req.body?.access_code ?? '').trim().toUpperCase()
    if (!code) {
      return res.status(400).json({ error: 'access_code is required' })
    }

    const snap = await adminDb.collection(COLLECTION).where('access_code', '==', code).limit(1).get()
    if (snap.empty) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const doc = snap.docs[0]
    const sessionData = doc.data()
    await expireSessionIfStale(doc.ref, sessionData)

    const v = validateSessionSnapshot(doc)
    if (v.status) {
      return res.status(v.status).json({ error: v.error })
    }

    const sessionId = doc.id
    
    // Check crew access control
    if (req.auth && req.userRole === 'crew') {
      const assignedCrewIds = sessionData.assigned_crew_ids || []
      if (!assignedCrewIds.includes(req.auth.uid)) {
        return res.status(403).json({ 
          error: 'You are not assigned to this session' 
        })
      }
    }
    
    // Auto-update flightId claims for admin and crew users when session is active
    if (req.auth && (req.userRole === 'admin' || req.userRole === 'crew')) {
      try {
        await adminAuth.setCustomUserClaims(req.auth.uid, {
          flightId: sessionId,
          role: req.userRole
        })
        console.log(`Auto-updated ${req.userRole} claims for session:`, sessionId)
      } catch (claimError) {
        console.warn(`Failed to auto-update ${req.userRole} claims:`, claimError.message)
        // Don't fail the request, just log the error
      }
    }

    return res.json({
      success: true,
      flight_instance_id: sessionId,
      session: safeSessionPayload(sessionId, doc.data()),
    })
  } catch (error) {
    console.error('resolveSession:', error)
    return res.status(500).json({ error: 'Failed to resolve session' })
  }
}

/**
 * GET /api/session/route-lookup?flight_number=MH123&date=YYYY-MM-DD
 */
export async function lookupFlightRoute(req, res) {
  try {
    const flightNumber = String(req.query.flight_number ?? '').trim().toUpperCase()
    const date = String(req.query.date ?? '').trim()

    if (!flightNumber) {
      return res.status(400).json({ error: 'flight_number is required' })
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' })
    }

    const parsed = parseFlightNumber(flightNumber)
    try {
      const flightResults = await fetchAviationstack('flights', {
        flight_iata: parsed.flightIata,
        flight_num: parsed.number,
        limit: '1',
      })
      const flightRoute = flightResults.map(readRouteFromItem).find(Boolean)
      if (flightRoute) {
        return res.json({ ok: true, source: 'flights', ...flightRoute })
      }
    } catch (error) {
      if (!isPlanUnsupported(error)) throw error
      return res.status(403).json({
        error: 'Your Aviationstack subscription does not support real-time flight lookup. Enter the route manually or upgrade the API plan.',
      })
    }

    return res.status(404).json({ error: 'No active real-time flight found. Enter the route manually.' })
  } catch (error) {
    console.error('lookupFlightRoute:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Failed to look up route' })
  }
}

/**
 * POST /api/session/:id/join-passenger
 */
export async function joinPassenger(req, res) {
  const { id } = req.params
  const seatRaw = req.body?.seat_number ?? req.body?.seatNumber
  if (!id?.trim()) {
    return res.status(400).json({ error: 'Session id is required' })
  }
  if (!seatRaw?.trim()) {
    return res.status(400).json({ error: 'seat_number is required' })
  }

  const normalizedSeat = normalizeSeat(seatRaw)

  try {
    await adminDb.runTransaction(async (tx) => {
      const ref = adminDb.collection(COLLECTION).doc(id.trim())
      const snap = await tx.get(ref)
      if (!snap.exists) {
        const err = new Error('nf')
        err.http = 404
        throw err
      }
      const data = snap.data()
      if (isSessionExpired(data)) {
        if (data.status === 'active') {
          tx.update(ref, buildExpireUpdate())
        }
        const err = new Error('exp')
        err.http = 410
        throw err
      }
      if (data.status !== 'active') {
        const err = new Error('ina')
        err.http = 403
        throw err
      }

      const occupied = [...(data.occupied_seats || [])]
      if (occupied.some((s) => normalizeSeat(s) === normalizedSeat)) {
        const err = new Error('seat')
        err.http = 409
        throw err
      }

      occupied.push(normalizedSeat)
      tx.update(ref, {
        occupied_seats: occupied,
        updated_at: new Date().toISOString(),
      })
    })

    const updated = await adminDb.collection(COLLECTION).doc(id.trim()).get()
    const payload = safeSessionPayload(updated.id, updated.data())
    return res.json({
      success: true,
      session: payload,
    })
  } catch (error) {
    if (error.http === 404) return res.status(404).json({ error: 'Session not found' })
    if (error.http === 410) return res.status(410).json({ error: 'Session has expired' })
    if (error.http === 403) return res.status(403).json({ error: 'Session is not active' })
    if (error.http === 409) {
      return res.status(409).json({ error: 'Seat is already occupied', seat_number: normalizedSeat })
    }
    console.error('joinPassenger:', error)
    return res.status(500).json({ error: 'Failed to join session' })
  }
}

/**
 * POST /api/session — create (auth required at route)
 */
export async function createSession(req, res) {
  try {
    const { flight_number, date, departure_time, route, assigned_crew_ids } = req.body ?? {}

    if (!flight_number?.trim()) {
      return res.status(400).json({ error: 'flight_number is required' })
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' })
    }
    if (!departure_time?.trim()) {
      return res.status(400).json({ error: 'departure_time is required' })
    }

    const normalizedFlight = flight_number.trim().toUpperCase()
    const normalizedDate = formatDateForQuery(date)
    const access_code = await generateUniqueAccessCode()
    const expiresAt = calculateExpiresAt(normalizedDate, departure_time)
    const nowIso = new Date().toISOString()
    const sessionId = uuidv4()
    const newRef = adminDb.collection(COLLECTION).doc(sessionId)

    await adminDb.runTransaction(async (tx) => {
      const activeQuery = adminDb
        .collection(COLLECTION)
        .where('flight_number', '==', normalizedFlight)
        .where('date', '==', normalizedDate)
        .where('status', '==', 'active')
      const activeSnap = await tx.get(activeQuery)

      activeSnap.docs.forEach((doc) => {
        tx.update(doc.ref, {
          status: 'ended',
          ended_at: FieldValue.serverTimestamp(),
          updated_at: nowIso,
        })
      })

      tx.set(newRef, {
        flight_number: normalizedFlight,
        date: normalizedDate,
        departure_time: departure_time.trim(),
        route: route?.trim() || null,
        access_code,
        expires_at: expiresAt,
        status: 'active',
        ended_at: null,
        occupied_seats: [],
        assigned_crew_ids: Array.isArray(assigned_crew_ids) ? assigned_crew_ids : [],
        created_at: nowIso,
        updated_at: nowIso,
      })
    })

    const created = await newRef.get()
    return res.status(201).json({
      success: true,
      session: safeSessionPayload(created.id, created.data()),
    })
  } catch (error) {
    console.error('createSession:', error)
    return res.status(500).json({ error: 'Failed to create session' })
  }
}

/**
 * GET /api/session/summary — admin list (auth at route)
 * scope=global | filtered + flight_number + date for filtered
 */
export async function getSessionSummary(req, res) {
  try {
    const scope = String(req.query.scope ?? 'global').toLowerCase()
    const flight_number = req.query.flight_number
      ? String(req.query.flight_number).trim().toUpperCase()
      : ''
    const date = req.query.date ? formatDateForQuery(req.query.date) : ''

    let activeList = []
    let endedList = []

    if (scope === 'filtered') {
      if (!flight_number || !date) {
        return res.status(400).json({
          error: 'filtered scope requires flight_number and date query params',
        })
      }
      // Get all sessions for this flight and date, then filter by status in JavaScript
      const flightSnap = await adminDb
        .collection(COLLECTION)
        .where('flight_number', '==', flight_number)
        .where('date', '==', date)
        .get()
      
      const activeDocs = flightSnap.docs.filter((d) => d.data().status === 'active')
      const { active, expired } = await expireStaleActiveDocs(activeDocs)
      activeList = active

      const endedDocs = flightSnap.docs
        .filter((d) => {
          const status = d.data().status
          return status === 'ended' || status === 'expired'
        })
        .map((d) => ({ id: d.id, data: d.data() }))
      const mergedEnded = [...endedDocs, ...expired.map((s) => ({ id: s.id, data: s }))]
      const seen = new Set()
      const uniqueEnded = mergedEnded.filter((d) => {
        if (seen.has(d.id)) return false
        seen.add(d.id)
        return true
      })
      endedList = mapEndedRecent(uniqueEnded)
    } else {
      const activeSnap = await adminDb.collection(COLLECTION).where('status', '==', 'active').get()
      const { active, expired } = await expireStaleActiveDocs(activeSnap.docs)
      activeList = active

      const [endedSnap, expiredSnap] = await Promise.all([
        adminDb.collection(COLLECTION).where('status', '==', 'ended').limit(10).get(),
        adminDb.collection(COLLECTION).where('status', '==', 'expired').limit(10).get(),
      ])
      const endedDocs = [
        ...endedSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
        ...expiredSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
        ...expired.map((s) => ({ id: s.id, data: s })),
      ]
      const seen = new Set()
      const uniqueEnded = endedDocs.filter((d) => {
        if (seen.has(d.id)) return false
        seen.add(d.id)
        return true
      })
      endedList = mapEndedRecent(uniqueEnded)
    }

    return res.json({
      success: true,
      scope: scope === 'filtered' ? 'filtered' : 'global',
      active: activeList,
      ended_recent: endedList,
    })
  } catch (error) {
    console.error('getSessionSummary:', error)
    return res.status(500).json({
      error: 'Failed to fetch session summary',
      hint: 'Firestore composite indexes may be required for status + ended_at queries.',
    })
  }
}

/** Legacy: full list — prefer summary */
export async function getAllSessions(req, res) {
  try {
    const snapshot = await adminDb.collection(COLLECTION).get()
    const activeDocs = snapshot.docs.filter((d) => d.data().status === 'active')
    await expireStaleActiveDocs(activeDocs)

    const refreshed = await adminDb.collection(COLLECTION).get()
    const allSessions = refreshed.docs.map((doc) => safeSessionPayload(doc.id, doc.data()))

    // Separate active/ended sessions from deleted ones
    const activeSessions = allSessions.filter((s) => s.status !== 'deleted')
    const deletedSessions = allSessions.filter((s) => s.status === 'deleted')
    
    return res.json({ 
      success: true, 
      sessions: activeSessions,
      deleted_sessions: deletedSessions // For reporting purposes
    })
  } catch (error) {
    console.error('getAllSessions:', error)
    return res.status(500).json({ error: 'Failed to fetch sessions' })
  }
}

/**
 * PATCH /api/session/:id/end
 */
export async function endSession(req, res) {
  try {
    const { id } = req.params
    if (!id?.trim()) {
      return res.status(400).json({ error: 'session id is required' })
    }

    const ref = adminDb.collection(COLLECTION).doc(id.trim())
    const snap = await ref.get()
    if (!snap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const nowIso = new Date().toISOString()
    await ref.update({
      status: 'ended',
      ended_at: FieldValue.serverTimestamp(),
      updated_at: nowIso,
    })

    const updated = await ref.get()
    return res.json({
      success: true,
      message: 'Session ended',
      session: safeSessionPayload(updated.id, updated.data()),
    })
  } catch (error) {
    console.error('endSession:', error)
    return res.status(500).json({ error: 'Failed to end session' })
  }
}

/**
 * PUT /api/session/:id
 */
export async function updateSession(req, res) {
  try {
    const { id } = req.params
    const { flight_number, date, departure_time, route, assigned_crew_ids } = req.body ?? {}

    if (!id?.trim()) {
      return res.status(400).json({ error: 'session id is required' })
    }

    const sessionRef = adminDb.collection(COLLECTION).doc(id.trim())
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    await expireSessionIfStale(sessionRef, sessionSnap.data())

    const v = validateSessionSnapshot(sessionSnap)
    if (v.status === 410) {
      return res.status(410).json({
        error: 'Session has expired',
        session: safeSessionPayload(sessionSnap.id, {
          ...sessionSnap.data(),
          status: 'expired',
        }),
      })
    }
    if (v.status === 403) {
      return res.status(403).json({
        error: 'Cannot update inactive session',
        session: safeSessionPayload(sessionSnap.id, sessionSnap.data()),
      })
    }

    const sessionData = sessionSnap.data()
    const updateData = { updated_at: new Date().toISOString() }

    let newFlightNumber = sessionData.flight_number
    let newDate = sessionData.date
    let newDepartureTime = sessionData.departure_time

    if (flight_number !== undefined) {
      newFlightNumber = String(flight_number).trim().toUpperCase()
      updateData.flight_number = newFlightNumber
    }
    if (date !== undefined) {
      newDate = formatDateForQuery(date)
      updateData.date = newDate
    }
    if (departure_time !== undefined) {
      newDepartureTime = String(departure_time).trim()
      updateData.departure_time = newDepartureTime
    }
    if (route !== undefined) {
      updateData.route = route?.trim() || null
    }
    if (assigned_crew_ids !== undefined) {
      updateData.assigned_crew_ids = Array.isArray(assigned_crew_ids) ? assigned_crew_ids : []
    }

    if (flight_number !== undefined || date !== undefined) {
      const dup = await adminDb
        .collection(COLLECTION)
        .where('flight_number', '==', newFlightNumber)
        .where('date', '==', newDate)
        .where('status', '==', 'active')
        .get()

      const otherActive = dup.docs.filter((doc) => doc.id !== id.trim())
      if (otherActive.length > 0) {
        return res.status(409).json({
          error: 'Another active session exists for this flight and date',
        })
      }
    }

    if (date !== undefined || departure_time !== undefined) {
      updateData.expires_at = calculateExpiresAt(newDate, newDepartureTime)
    }

    await sessionRef.update(updateData)
    const updatedSnap = await sessionRef.get()
    return res.json({
      success: true,
      message: 'Session updated',
      session: safeSessionPayload(updatedSnap.id, updatedSnap.data()),
    })
  } catch (error) {
    console.error('updateSession:', error)
    return res.status(500).json({ error: 'Failed to update session' })
  }
}

export async function deleteSession(req, res) {
  try {
    const { id } = req.params
    if (!id?.trim()) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    const sessionRef = adminDb.collection(COLLECTION).doc(id.trim())
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const sessionData = sessionSnap.data()
    if (sessionData.status === 'active') {
      return res.status(409).json({
        error: 'Cannot delete active session. End it first.',
        session: safeSessionPayload(sessionSnap.id, sessionData),
      })
    }

    // Soft delete: mark as deleted instead of removing from database
    const nowIso = new Date().toISOString()
    await sessionRef.update({
      status: 'deleted',
      deleted_at: nowIso,
      updated_at: nowIso,
    })
    
    return res.json({
      success: true,
      message: 'Session deleted successfully',
      session: {
        id: sessionSnap.id,
        flight_number: sessionData.flight_number,
        date: sessionData.date,
        status: 'deleted',
        deleted_at: nowIso,
      },
    })
  } catch (error) {
    console.error('deleteSession:', error)
    return res.status(500).json({ error: 'Failed to delete session' })
  }
}

/**
 * PUT /api/session/:id/assign-crew - Assign crew members to a session
 */
export async function assignCrewToSession(req, res) {
  try {
    const { id } = req.params
    const { crew_ids } = req.body ?? {}

    if (!id?.trim()) {
      return res.status(400).json({ error: 'Session ID is required' })
    }
    if (!Array.isArray(crew_ids)) {
      return res.status(400).json({ error: 'crew_ids must be an array' })
    }

    const sessionRef = adminDb.collection(COLLECTION).doc(id.trim())
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const nowIso = new Date().toISOString()
    await sessionRef.update({
      assigned_crew_ids: crew_ids,
      updated_at: nowIso,
    })

    const updated = await sessionRef.get()
    return res.json({
      success: true,
      message: 'Crew assignment updated successfully',
      session: safeSessionPayload(updated.id, updated.data()),
    })
  } catch (error) {
    console.error('assignCrewToSession:', error)
    return res.status(500).json({ error: 'Failed to assign crew to session' })
  }
}

/**
 * GET /api/session/:id — validate read-only (no DB mutations)
 */
export async function getSessionById(req, res) {
  try {
    const { id } = req.params
    if (!id?.trim()) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    const sessionRef = adminDb.collection(COLLECTION).doc(id.trim())
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    await expireSessionIfStale(sessionRef, sessionSnap.data())

    const v = validateSessionSnapshot(sessionSnap)
    if (v.status === 410) {
      return res.status(410).json({
        error: 'Session has expired',
        session: safeSessionPayload(sessionSnap.id, {
          ...sessionSnap.data(),
          status: 'expired',
        }),
      })
    }
    if (v.status === 403) {
      return res.status(403).json({
        error: 'Session is not active',
        session: safeSessionPayload(sessionSnap.id, sessionSnap.data()),
      })
    }

    return res.json({
      success: true,
      session: safeSessionPayload(sessionSnap.id, sessionSnap.data()),
    })
  } catch (error) {
    console.error('getSessionById:', error)
    return res.status(500).json({ error: 'Failed to fetch session' })
  }
}

async function loadSessionForSeatCheck(sessionId) {
  const sessionRef = adminDb.collection(COLLECTION).doc(sessionId)
  const sessionSnap = await sessionRef.get()
  if (!sessionSnap.exists) return null
  return { ref: sessionRef, snap: sessionSnap, data: sessionSnap.data() }
}

export async function checkSeatAvailability(req, res) {
  try {
    const { id, seatNumber } = req.params
    if (!id?.trim()) {
      return res.status(400).json({ error: 'Session ID is required' })
    }
    if (!seatNumber?.trim()) {
      return res.status(400).json({ error: 'Seat number is required' })
    }

    const loaded = await loadSessionForSeatCheck(id.trim())
    if (!loaded) return res.status(404).json({ error: 'Session not found' })

    await expireSessionIfStale(loaded.ref, loaded.data)

    const v = validateSessionSnapshot(loaded.snap)
    if (v.status === 410) return res.status(410).json({ error: 'Session has expired' })
    if (v.status === 403) return res.status(403).json({ error: 'Session is not active' })

    const normalized = normalizeSeat(seatNumber)
    const occupied = loaded.data.occupied_seats || []
    const taken = occupied.some((s) => normalizeSeat(s) === normalized)

    return res.json({
      success: true,
      available: !taken,
      seatNumber: normalized,
      sessionId: id.trim(),
    })
  } catch (error) {
    console.error('checkSeatAvailability:', error)
    return res.status(500).json({ error: 'Failed to check seat availability' })
  }
}

export async function occupySeat(req, res) {
  try {
    const { id } = req.params
    const seatNumber = req.body?.seatNumber ?? req.body?.seat_number
    if (!id?.trim()) {
      return res.status(400).json({ error: 'Session ID is required' })
    }
    if (!seatNumber?.trim()) {
      return res.status(400).json({ error: 'Seat number is required' })
    }

    req.params.id = id.trim()
    req.body = { ...req.body, seat_number: seatNumber }
    return joinPassenger(req, res)
  } catch (error) {
    console.error('occupySeat:', error)
    return res.status(500).json({ error: 'Failed to occupy seat' })
  }
}
