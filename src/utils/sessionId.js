/**
 * Parse manual entry or pasted QR URL into a session identifier string.
 */
export function parseSessionInput(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    const seg = url.pathname.split('/').filter(Boolean).pop()
    if (seg) return decodeURIComponent(seg)
    return (
      url.searchParams.get('s') ||
      url.searchParams.get('session') ||
      url.searchParams.get('id') ||
      trimmed
    )
  } catch {
    return trimmed
  }
}

/**
 * Enhanced QR code data parser
 * Extracts sessionId, seatNumber, and flightNumber from QR code data
 * Supports multiple QR formats:
 * - JSON: {"sessionId":"abc123","seatNumber":"12A","flightNumber":"MH123"}
 * - URL: /join?sessionId=abc123&seatNumber=12A&flightNumber=MH123
 * - Simple: abc123 (sessionId only)
 * - Custom: sessionId:abc123;seat:12A;flight:MH123
 */
export function parseQRCodeData(rawData) {
  const trimmed = String(rawData ?? '').trim()
  if (!trimmed) return null

  try {
    // Try parsing as JSON first
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      return {
        sessionId: parsed.sessionId || parsed.session_id || parsed.id,
        seatNumber: parsed.seatNumber || parsed.seat || parsed.seat_number,
        flightNumber: parsed.flightNumber || parsed.flight || parsed.flight_number
      }
    }

    // Try parsing as URL
    if (trimmed.includes('://') || trimmed.includes('/join') || trimmed.includes('?')) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com${trimmed}`)
        return {
          sessionId: url.searchParams.get('sessionId') || url.searchParams.get('session') || url.searchParams.get('id') || url.searchParams.get('s'),
          seatNumber: url.searchParams.get('seatNumber') || url.searchParams.get('seat') || url.searchParams.get('seat_number'),
          flightNumber: url.searchParams.get('flightNumber') || url.searchParams.get('flight') || url.searchParams.get('flight_number')
        }
      } catch {
        // Continue to next parsing method
      }
    }

    // Try parsing as key-value pairs (semicolon or comma separated)
    if (trimmed.includes(':') || trimmed.includes('=')) {
      const pairs = trimmed.split(/[;,]/)
      const result = {}
      
      for (const pair of pairs) {
        const [key, value] = pair.split(/[=:]/).map(s => s.trim())
        if (key && value) {
          const normalizedKey = key.toLowerCase()
          if (normalizedKey.includes('session') || normalizedKey.includes('id')) {
            result.sessionId = value
          } else if (normalizedKey.includes('seat')) {
            result.seatNumber = value
          } else if (normalizedKey.includes('flight')) {
            result.flightNumber = value
          }
        }
      }
      
      if (Object.keys(result).length > 0) {
        return result
      }
    }

    // Fallback: treat as simple sessionId
    if (isValidSessionIdFormat(trimmed)) {
      return { sessionId: trimmed }
    }

    return null
  } catch (error) {
    console.error('QR parsing error:', error)
    return null
  }
}

/**
 * Client-side format check before hitting Firestore.
 */
export function isValidSessionIdFormat(id) {
  return /^[a-zA-Z0-9_-]{6,64}$/.test(id)
}
