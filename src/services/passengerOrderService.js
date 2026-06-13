/**
 * Passenger orders: backend order placement + real-time order subscription.
 */
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const ORDERS = 'orders'

function normalizeSeat(seat) {
  return String(seat ?? '')
    .trim()
    .toUpperCase()
}

function normalizeOrder(docSnap) {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    orderId: String(data.orderId ?? docSnap.id),
    sessionId: String(data.sessionId ?? ''),
    seatNumber: String(data.seatNumber ?? ''),
    mealId: String(data.mealId ?? ''),
    meal: String(data.meal ?? ''),
    drink: String(data.drink ?? ''),
    dessert: String(data.dessert ?? ''),
    snack: String(data.snack ?? ''),
    notes: String(data.notes ?? ''),
    status: String(data.status ?? 'pending').toLowerCase(),
    timestamp: data.timestamp ?? data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/**
 * Subscribe to the single order doc for this seat: orders/{flightInstanceId_seat}
 */
export function subscribeOrderForSession(flightInstanceId, seatNumber, onData, onError) {
  if (!db || !flightInstanceId || !seatNumber) {
    onData(null)
    return () => {}
  }
  const seat = normalizeSeat(seatNumber)
  const docId = `${flightInstanceId}_${seat}`
  const ref = doc(db, ORDERS, docId)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      onData(normalizeOrder(snap))
    },
    onError,
  )
}

export async function placeOrderTransaction({
  sessionId,
  seatNumber,
  mealId,
  drinkId,
  dessertId,
  snackId,
  mealName,
  drinkName,
  dessertName,
  snackName,
  notes,
}) {
  if (!sessionId || !seatNumber || !mealId) {
    throw new Error('Session, seat, and meal are required.')
  }

  const payload = {
    sessionId,
    seatNumber,
    mealId,
    mealName,
    drinkId,
    drinkName,
    dessertId,
    dessertName,
    snackId,
    snackName,
    notes,
  }

  const res = await fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || 'Could not place order.')
  }

  return { ok: true, orderId: data?.id || '' }
}
