import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../firebaseAdmin.js'

function sameFlight(a, b) {
  const x = String(a ?? '').trim().toLowerCase()
  const y = String(b ?? '').trim().toLowerCase()
  return Boolean(x) && Boolean(y) && x === y
}

function normalizeStock(value) {
  const parsed = Number(value)
  // Fix: Only return 0 for negative values, allow 0 and positive values
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.floor(parsed)
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
}

function normalizeNameList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
}

function validateColor(color) {
  if (!color) return '#3b82f6' // Default blue color
  
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  if (!colorRegex.test(color)) {
    throw new Error('Color must be a valid hex color code (e.g., #ff6600)')
  }
  
  return color
}

function shapeMeal(body = {}) {
  const stock = normalizeStock(body.stock)
  const drinkIds = normalizeIdList(body.drinkIds)
  const dessertIds = normalizeIdList(body.dessertIds)
  const snackIds = normalizeIdList(body.snackIds)
  const drinkOptions = normalizeNameList(body.drinkOptions)
  const dessertOptions = normalizeNameList(body.dessertOptions)
  const snackOptions = normalizeNameList(body.snackOptions)
  const allergens = normalizeNameList(body.allergens)
  
  // Validate and normalize color
  const color = validateColor(body.color)
  
  return {
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    imageUrl: String(body.imageUrl ?? '').trim(),
    color, // Add color field
    stock,
    category: 'meal',
    available: stock > 0,
    drinkIds,
    dessertIds,
    snackIds,
    drinkOptions,
    dessertOptions,
    snackOptions,
    allergens,
    drinkLabel: String(body.drinkLabel ?? 'Drinks').trim() || 'Drinks',
    dessertLabel: String(body.dessertLabel ?? 'Desserts').trim() || 'Desserts',
    snackLabel: String(body.snackLabel ?? 'Snacks').trim() || 'Snacks',
  }
}

export async function listMenu(req, res) {
  const filterId = String(req.query?.flightId ?? '').trim()
  
  try {
    const snap = await adminDb.collection('menu').orderBy('name').get()
    const items = snap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => {
        if (!filterId) return true
        const fid = String(item.flightId ?? '').trim()
        return fid && sameFlight(fid, filterId)
      })
    
    return res.json({
      ok: true,
      items,
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error?.message || 'Could not load menu.' })
  }
}

export async function createMenuMeal(req, res) {
  // Use flightInstanceId from payload if provided (admin override), otherwise use token flightId
  const payloadFlightId = String(req.body?.flightInstanceId ?? '').trim()
  const tokenFlightId = String(req.userFlightId ?? '').trim()
  const flightInstanceId = payloadFlightId || tokenFlightId

  try {
    const meal = shapeMeal(req.body)
    if (!meal.name) return res.status(400).json({ ok: false, message: 'Meal name is required.' })
    if (!flightInstanceId && req.userRole !== 'admin') {
      return res.status(400).json({ ok: false, message: 'flightId claim required on token.' })
    }

    const ref = await adminDb.collection('menu').add({
      ...meal,
      flightId: flightInstanceId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    
    return res.status(201).json({ ok: true, id: ref.id })
  } catch (error) {
    // Handle color validation errors specifically
    if (error.message.includes('Color must be a valid hex color code')) {
      return res.status(400).json({ ok: false, message: error.message })
    }
    return res.status(500).json({ ok: false, message: error?.message || 'Could not create meal.' })
  }
}

export async function updateMenuMeal(req, res) {
  // Use flightInstanceId from payload if provided (admin override), otherwise use token flightId
  const payloadFlightId = String(req.body?.flightInstanceId ?? '').trim()
  const tokenFlightId = String(req.userFlightId ?? '').trim()
  const flightInstanceId = payloadFlightId || tokenFlightId
  const mealId = String(req.params.mealId ?? '').trim()

  try {
    const meal = shapeMeal(req.body)
    if (!mealId) return res.status(400).json({ ok: false, message: 'Meal id is required.' })
    if (!meal.name) return res.status(400).json({ ok: false, message: 'Meal name is required.' })
    if (!flightInstanceId && req.userRole !== 'admin') {
      return res.status(400).json({ ok: false, message: 'flightId claim required on token.' })
    }

    const ref = adminDb.collection('menu').doc(mealId)
    const current = await ref.get()
    if (!current.exists) return res.status(404).json({ ok: false, message: 'Menu item not found.' })
    if (!sameFlight(current.data()?.flightId, flightInstanceId) && req.userRole !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Menu item not in this flight instance.' })
    }

    await ref.update({
      ...meal,
      flightId: flightInstanceId,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return res.json({ ok: true })
  } catch (error) {
    // Handle color validation errors specifically
    if (error.message.includes('Color must be a valid hex color code')) {
      return res.status(400).json({ ok: false, message: error.message })
    }
    return res.status(500).json({ ok: false, message: error?.message || 'Could not update meal.' })
  }
}

export async function removeMenuMeal(req, res) {
  const flightInstanceId = String(req.userFlightId ?? '').trim()
  const mealId = String(req.params.mealId ?? '').trim()
  if (!mealId) return res.status(400).json({ ok: false, message: 'Meal id is required.' })
  try {
    const ref = adminDb.collection('menu').doc(mealId)
    const current = await ref.get()
    if (!current.exists) return res.status(404).json({ ok: false, message: 'Menu item not found.' })
    if ((!flightInstanceId || !sameFlight(current.data()?.flightId, flightInstanceId)) && req.userRole !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Menu item not in this flight instance.' })
    }
    await ref.delete()
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error?.message || 'Could not delete meal.' })
  }
}
