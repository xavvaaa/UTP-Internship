/**
 * Validates a passenger session document in Firestore.
 */
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { isValidSessionIdFormat } from '../utils/sessionId'

export async function validateSession(sessionLookup) {
  if (!db) {
    return { ok: false, code: 'firebase_config', message: 'Firebase is not configured.' }
  }

  if (typeof sessionLookup === 'string') {
    const sessionId = sessionLookup
    if (!isValidSessionIdFormat(sessionId)) {
      return { ok: false, code: 'format', message: 'Enter a valid session code (6-64 letters, numbers, - or _).' }
    }

    const ref = doc(db, 'sessions', sessionId)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      return { ok: false, code: 'not_found', message: 'Session not found. Check the code and try again.' }
    }
    const data = snap.data()
    if (data.active === false) {
      return { ok: false, code: 'inactive', message: 'This session is no longer active.' }
    }
    return {
      ok: true,
      sessionId,
      flightId: data.flightId ?? null,
      seatNumber: data.seatNumber ?? data.seat ?? null,
    }
  }

  const { flightId, seatNumber } = sessionLookup ?? {}
  const normalizedFlightId = String(flightId ?? '').trim()
  const normalizedSeat = String(seatNumber ?? '').trim().toUpperCase()

  if (!normalizedFlightId) {
    return { ok: false, code: 'format', message: 'Enter your flight number.' }
  }
  if (!normalizedSeat) {
    return { ok: false, code: 'format', message: 'Enter your seat number.' }
  }

  const q = query(collection(db, 'sessions'), where('flightId', '==', normalizedFlightId))
  const snap = await getDocs(q)
  if (snap.empty) {
    return { ok: false, code: 'not_found', message: 'No matching session found for that flight number.' }
  }

  const matched = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .find(
      (item) =>
        String(item.seatNumber ?? item.seat ?? '').trim().toUpperCase() === normalizedSeat,
    )

  if (!matched) {
    return {
      ok: false,
      code: 'not_found',
      message: 'No matching seat found for that flight number. Check the seat on your seatback.',
    }
  }

  if (matched.active === false) {
    return { ok: false, code: 'inactive', message: 'This session is no longer active.' }
  }

  return {
    ok: true,
    sessionId: matched.id,
    flightId: matched.flightId ?? null,
    seatNumber: matched.seatNumber ?? matched.seat ?? null,
  }
}
