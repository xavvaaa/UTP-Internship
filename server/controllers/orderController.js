import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../firebaseAdmin.js'

function badRequest(res, message) {
  return res.status(400).json({ ok: false, message })
}

function normalizeSeat(seat) {
  return String(seat ?? '')
    .trim()
    .toUpperCase()
}

/** Same semantics as session validation: 404 / 410 / 403 — no DB writes */
function validateFlightSessionData(snap) {
  if (!snap.exists) return { code: 404, message: 'Flight session not found.' }
  const data = snap.data()
  if (data.expires_at && new Date() >= new Date(data.expires_at)) {
    return { code: 410, message: 'Flight session has expired.' }
  }
  if (data.status !== 'active') {
    return { code: 403, message: 'Flight session is not active.' }
  }
  return { ok: true, data }
}

export async function createOrder(req, res) {
  const {
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
    flightId: _ignoreFlightId,
  } = req.body ?? {}

  const session = String(sessionId ?? '').trim()
  const seat = normalizeSeat(seatNumber)
  const menuId = String(mealId ?? '').trim()
  const meal = String(mealName ?? '').trim()
  const drinkMenuId = String(drinkId ?? '').trim()
  const dessertMenuId = String(dessertId ?? '').trim()
  const snackMenuId = String(snackId ?? '').trim()
  const passengerNotes = String(notes ?? '').trim().slice(0, 300)

  if (!session || !seat || !menuId) {
    return badRequest(res, 'sessionId, seatNumber, and mealId are required.')
  }

  const sessionRef = adminDb.collection('flight_sessions').doc(session)
  const sessionSnap = await sessionRef.get()
  const sv = validateFlightSessionData(sessionSnap)
  if (sv.code === 404) return res.status(404).json({ ok: false, message: sv.message })
  if (sv.code === 410) return res.status(410).json({ ok: false, message: sv.message })
  if (sv.code === 403) return res.status(403).json({ ok: false, message: sv.message })

  const flightInstanceId = sessionRef.id
  const sessionData = sv.data
  const occupied = (sessionData.occupied_seats || []).map((s) => normalizeSeat(s))
  if (!occupied.includes(seat)) {
    return res.status(403).json({
      ok: false,
      message: 'Seat is not registered for this flight session. Join the session first.',
    })
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const orderRef = adminDb.collection('orders').doc(`${flightInstanceId}_${seat}`)
      const menuRef = adminDb.collection('menu').doc(menuId)
      const drinkRef = drinkMenuId ? adminDb.collection('menu').doc(drinkMenuId) : null
      const dessertRef = dessertMenuId ? adminDb.collection('menu').doc(dessertMenuId) : null
      const snackRef = snackMenuId ? adminDb.collection('menu').doc(snackMenuId) : null

      const refs = [tx.get(orderRef), tx.get(menuRef)]
      if (drinkRef) refs.push(tx.get(drinkRef))
      if (dessertRef) refs.push(tx.get(dessertRef))
      if (snackRef) refs.push(tx.get(snackRef))
      const results = await Promise.all(refs)
      const orderSnap = results[0]
      const menuSnap = results[1]
      let idx = 2
      const drinkSnap = drinkRef ? results[idx++] : null
      const dessertSnap = dessertRef ? results[idx++] : null
      const snackSnap = snackRef ? results[idx++] : null

      if (orderSnap.exists) {
        const err = new Error('An order already exists for this seat.')
        err.code = 'duplicate_order'
        throw err
      }

      if (!menuSnap.exists) {
        const err = new Error('Selected meal is not found.')
        err.code = 'meal_not_found'
        throw err
      }

      const menuData = menuSnap.data()
      const menuFlight = String(menuData?.flightId ?? '').trim()
      if (menuFlight && menuFlight !== flightInstanceId) {
        const err = new Error('Selected meal is not available for this flight.')
        err.code = 'meal_flight_mismatch'
        throw err
      }
      const currentStock = Math.max(0, Number(menuData?.stock ?? 0))
      if (currentStock <= 0) {
        const err = new Error('Meal is out of stock.')
        err.code = 'out_of_stock'
        throw err
      }

      const nextStock = currentStock - 1

      tx.update(menuRef, {
        stock: nextStock,
        available: nextStock > 0,
        updatedAt: FieldValue.serverTimestamp(),
      })

      let drinkText = String(drinkName ?? '').trim()
      if (drinkRef) {
        if (!drinkSnap?.exists) {
          const err = new Error('Selected drink is not found.')
          err.code = 'drink_not_found'
          throw err
        }
        const drinkStock = Math.max(0, Number(drinkSnap.data()?.stock ?? 0))
        const df = String(drinkSnap.data()?.flightId ?? '').trim()
        if (df && df !== flightInstanceId) {
          const err = new Error('Selected drink is not available for this flight.')
          err.code = 'drink_flight_mismatch'
          throw err
        }
        if (drinkStock <= 0) {
          const err = new Error('Drink is out of stock.')
          err.code = 'drink_out_of_stock'
          throw err
        }
        tx.update(drinkRef, {
          stock: drinkStock - 1,
          available: drinkStock - 1 > 0,
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (!drinkText) drinkText = String(drinkSnap.data()?.name ?? '')
      }

      let dessertText = String(dessertName ?? '').trim()
      if (dessertRef) {
        if (!dessertSnap?.exists) {
          const err = new Error('Selected dessert is not found.')
          err.code = 'dessert_not_found'
          throw err
        }
        const dessertStock = Math.max(0, Number(dessertSnap.data()?.stock ?? 0))
        const ef = String(dessertSnap.data()?.flightId ?? '').trim()
        if (ef && ef !== flightInstanceId) {
          const err = new Error('Selected dessert is not available for this flight.')
          err.code = 'dessert_flight_mismatch'
          throw err
        }
        if (dessertStock <= 0) {
          const err = new Error('Dessert is out of stock.')
          err.code = 'dessert_out_of_stock'
          throw err
        }
        tx.update(dessertRef, {
          stock: dessertStock - 1,
          available: dessertStock - 1 > 0,
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (!dessertText) dessertText = String(dessertSnap.data()?.name ?? '')
      }

      let snackText = String(snackName ?? '').trim()
      if (snackRef) {
        if (!snackSnap?.exists) {
          const err = new Error('Selected snack is not found.')
          err.code = 'snack_not_found'
          throw err
        }
        const snackStock = Math.max(0, Number(snackSnap.data()?.stock ?? 0))
        const sf = String(snackSnap.data()?.flightId ?? '').trim()
        if (sf && sf !== flightInstanceId) {
          const err = new Error('Selected snack is not available for this flight.')
          err.code = 'snack_flight_mismatch'
          throw err
        }
        if (snackStock <= 0) {
          const err = new Error('Snack is out of stock.')
          err.code = 'snack_out_of_stock'
          throw err
        }
        tx.update(snackRef, {
          stock: snackStock - 1,
          available: snackStock - 1 > 0,
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (!snackText) snackText = String(snackSnap.data()?.name ?? '')
      }

      tx.set(orderRef, {
        orderId: `${flightInstanceId}_${seat}`,
        sessionId: flightInstanceId,
        flightId: flightInstanceId,
        seatNumber: seat,
        mealId: menuId,
        meal: meal || String(menuData?.name ?? 'Meal'),
        drink: drinkText,
        dessert: dessertText,
        snack: snackText,
        notes: passengerNotes,
        status: 'pending',
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    return res.status(201).json({ ok: true, id: `${flightInstanceId}_${seat}` })
  } catch (error) {
    if (error?.code === 'duplicate_order') {
      return res.status(409).json({ ok: false, code: error.code, message: error.message })
    }
    if (error?.code === 'meal_not_found' || error?.code === 'out_of_stock') {
      return res.status(422).json({ ok: false, code: error.code, message: error.message })
    }
    if (error?.code === 'meal_flight_mismatch') {
      return res.status(422).json({ ok: false, code: error.code, message: error.message })
    }
    if (
      error?.code === 'drink_not_found' ||
      error?.code === 'drink_out_of_stock' ||
      error?.code === 'drink_flight_mismatch' ||
      error?.code === 'dessert_not_found' ||
      error?.code === 'dessert_out_of_stock' ||
      error?.code === 'dessert_flight_mismatch' ||
      error?.code === 'snack_not_found' ||
      error?.code === 'snack_out_of_stock' ||
      error?.code === 'snack_flight_mismatch'
    ) {
      return res.status(422).json({ ok: false, code: error.code, message: error.message })
    }
    return res.status(500).json({ ok: false, message: error?.message || 'Could not store order.' })
  }
}

export async function updateOrderStatus(req, res) {
  const orderId = String(req.params.orderId ?? '').trim()
  const nextStatus = String(req.body?.status ?? '').trim().toLowerCase()
  const role = String(req.userRole ?? '').toLowerCase()
  const userFlightId = String(req.userFlightId ?? '').trim()

  if (!orderId || !nextStatus) return badRequest(res, 'orderId and status are required.')
  if (!['pending', 'preparing', 'delivered'].includes(nextStatus)) {
    return badRequest(res, 'Invalid status.')
  }

  try {
    const ref = adminDb.collection('orders').doc(orderId)
    const current = await ref.get()
    if (!current.exists) return res.status(404).json({ ok: false, message: 'Order not found.' })

    const orderFlightId = String(current.data()?.flightId ?? '').trim()
    const allowed =
      role === 'admin' || (orderFlightId && userFlightId && orderFlightId === userFlightId)

    if (!allowed) {
      return res.status(403).json({ ok: false, message: 'Not allowed to update this order.' })
    }

    await ref.update({
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error?.message || 'Could not update order.' })
  }
}
