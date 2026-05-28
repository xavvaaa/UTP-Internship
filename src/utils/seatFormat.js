/**
 * Validates narrow-body style seat labels (e.g. 12A).
 */
export function isValidSeatFormat(raw) {
  const s = String(raw ?? '').trim().toUpperCase()
  return /^[0-9]{1,3}[A-F]$/.test(s)
}
