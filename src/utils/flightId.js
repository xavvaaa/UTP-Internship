/**
 * Compare flight ids from env, JWT claims, and Firestore without case/whitespace surprises.
 */
export function normalizeFlightId(value) {
  return String(value ?? '').trim().toLowerCase()
}

/** When active flight is set, only include items with matching flightId (exclude empty flightId). */
export function menuItemMatchesActiveFlight(itemFlightId, activeFlightIdRaw) {
  const desired = normalizeFlightId(activeFlightIdRaw)
  const fid = normalizeFlightId(itemFlightId)
  if (!desired) return true // If no active flight, show all items
  return Boolean(fid) && fid === desired
}

export function flightIdsEqual(a, b) {
  return normalizeFlightId(a) === normalizeFlightId(b) && normalizeFlightId(a) !== ''
}
