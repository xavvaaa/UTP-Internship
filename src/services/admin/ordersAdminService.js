/**
 * Admin real-time order subscriptions, sorting, and status transitions.
 */
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

export const ORDER_STATUSES = ['pending', 'preparing', 'delivered']

export function parseSeat(seat) {
  const normalized = String(seat ?? '').toUpperCase().trim()
  const m = normalized.match(/^(\d+)([A-Z])$/)
  if (!m) return { row: Number.MAX_SAFE_INTEGER, col: 'Z', raw: normalized }
  return { row: Number(m[1]), col: m[2], raw: normalized }
}

export function sortOrders(orders, mode = 'seat') {
  const list = [...orders]
  if (mode === 'status') {
    return list.sort((a, b) => {
      const statusCmp = ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status)
      if (statusCmp !== 0) return statusCmp
      return compareSeat(a.seatNumber, b.seatNumber)
    })
  }
  if (mode === 'time') {
    return list.sort((a, b) => timestampMs(a.timestamp) - timestampMs(b.timestamp))
  }
  return list.sort((a, b) => compareSeat(a.seatNumber, b.seatNumber))
}

function compareSeat(a, b) {
  const sa = parseSeat(a)
  const sb = parseSeat(b)
  if (sa.row !== sb.row) return sa.row - sb.row
  return sa.col.localeCompare(sb.col)
}

function timestampMs(value) {
  if (!value) return 0
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

export function getNextOrderStatus(status) {
  const index = ORDER_STATUSES.indexOf(status)
  if (index < 0 || index >= ORDER_STATUSES.length - 1) return null
  return ORDER_STATUSES[index + 1]
}

export function subscribeOrders(onData, onError, flightInstanceId) {
  if (!db) {
    onData([])
    return () => {}
  }
  const fid = String(flightInstanceId ?? '').trim()
  if (!fid) {
    onData([])
    return () => {}
  }

  const q = query(
    collection(db, 'orders'),
    where('flightId', '==', fid),
  )
  return onSnapshot(
    q,
    (snap) => {
      const mapped = snap.docs.map((item) => {
        const data = item.data()
        return {
          id: item.id,
          orderId: String(data.orderId ?? item.id),
          sessionId: String(data.sessionId ?? item.id),
          seatNumber: String(data.seatNumber ?? ''),
          meal: String(data.meal ?? ''),
          drink: String(data.drink ?? ''),
          dessert: String(data.dessert ?? ''),
          snack: String(data.snack ?? ''),
          status: String(data.status ?? 'pending').toLowerCase(),
          timestamp: data.timestamp ?? data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          flightId: String(data.flightId ?? ''),
        }
      })
      // Sort by timestamp in JavaScript to avoid composite index requirement
      const sorted = mapped.sort((a, b) => {
        const aTime = timestampMs(a.timestamp)
        const bTime = timestampMs(b.timestamp)
        return aTime - bTime
      })
      onData(sorted)
    },
    onError,
  )
}

export async function advanceOrderStatus(orderId, currentStatus) {
  if (!db) throw new Error('Firebase is not configured.')
  const next = getNextOrderStatus(String(currentStatus ?? '').toLowerCase())
  if (!next) return null
  return setOrderStatus(orderId, next)
}

export async function setOrderStatus(orderId, status) {
  if (!db) throw new Error('Firebase is not configured.')
  const next = String(status ?? '').toLowerCase()
  if (!ORDER_STATUSES.includes(next)) throw new Error('Invalid order status.')
  const tokenResult = await auth?.currentUser?.getIdTokenResult(true)
  const token = tokenResult?.token
  if (!token) throw new Error('Login required.')
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: next }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Could not update status.')
  }
  return next
}
