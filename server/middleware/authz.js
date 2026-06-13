import { adminAuth } from '../firebaseAdmin.js'

function sameFlight(a, b) {
  const x = String(a ?? '').trim().toLowerCase()
  const y = String(b ?? '').trim().toLowerCase()
  return Boolean(x) && Boolean(y) && x === y
}

function readBearerToken(req) {
  const raw = String(req.headers.authorization ?? '')
  if (!raw.toLowerCase().startsWith('bearer ')) return ''
  return raw.slice(7).trim()
}

export async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req)
    if (!token) return res.status(401).json({ ok: false, message: 'Missing auth token.' })
    const decoded = await adminAuth.verifyIdToken(token)
    req.auth = decoded
    req.userRole = String(decoded.role ?? '').toLowerCase()
    req.userFlightId = String(decoded.flightId ?? '').trim()
    /** Canonical flight instance id for this user (must match flight_sessions doc id). */
    req.activeFlightId = req.userFlightId
    req.isAdminForActiveFlight =
      req.userRole === 'admin' && Boolean(req.userFlightId)
    next()
  } catch (error) {
    return res.status(401).json({ ok: false, message: error?.message || 'Invalid auth token.' })
  }
}

/** User must have flightId claim (crew/admin assigned to a flight instance). */
export function requireFlightClaim(req, res, next) {
  if (!req.userFlightId) {
    return res.status(403).json({
      ok: false,
      message: 'Your account needs a flightId claim matching the active flight instance.',
    })
  }
  next()
}

export function requireCrewOrAdminWithFlight(req, res, next) {
  const role = req.userRole
  const hasFlight = Boolean(req.userFlightId)
  const isAllowed = hasFlight && (role === 'crew' || role === 'admin')
  if (!isAllowed) {
    return res.status(403).json({ ok: false, message: 'Cabin access denied.' })
  }
  next()
}

export function requireAdminForActiveFlight(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required.' })
  }
  if (!req.userFlightId) {
    return res.status(403).json({ ok: false, message: 'Admin token must include flightId claim.' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required.' })
  }
  next()
}

export function requireAdminOrFlightClaim(req, res, next) {
  // Allow access if user is admin OR has flightId claim
  if (req.userRole === 'admin') {
    return next()
  }
  if (!req.userFlightId) {
    return res.status(403).json({
      ok: false,
      message: 'Your account needs a flightId claim matching the active flight instance.',
    })
  }
  next()
}
