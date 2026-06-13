/**
 * Admin menu CRUD + polling menu list for Firebase-backed content.
 */
import { auth, firebaseConfigured } from '../../firebase/config'
import { menuItemMatchesActiveFlight } from '../../utils/flightId'

export const MENU_COLLECTION = 'menu'
export const MENU_CATEGORIES = ['meal', 'drink', 'dessert', 'snack']

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
  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function normalizeNameList(value) {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

export function subscribeMenu(onData, onError, flightInstanceId) {
  if (!firebaseConfigured) {
    onData([])
    return () => {}
  }
  const fid = String(flightInstanceId ?? '').trim()
  let stopped = false

  function normalizeFromApi(data = {}) {
    const stock = normalizeStock(data.stock)
    return {
      id: String(data.id ?? ''),
      name: String(data.name ?? 'Meal'),
      description: String(data.description ?? ''),
      imageUrl: String(data.imageUrl ?? data.image ?? data.imageURL ?? '').trim(),
      color: String(data.color ?? '#3b82f6'),
      stock,
      category: MENU_CATEGORIES.includes(String(data.category ?? '').toLowerCase())
        ? String(data.category).toLowerCase()
        : 'meal',
      flightId: String(data.flightId ?? ''),
      available: stock > 0,
      drinkIds: normalizeIdList(data.drinkIds),
      dessertIds: normalizeIdList(data.dessertIds),
      snackIds: normalizeIdList(data.snackIds),
      drinkOptions: normalizeNameList(data.drinkOptions),
      dessertOptions: normalizeNameList(data.dessertOptions),
      snackOptions: normalizeNameList(data.snackOptions),
      allergens: normalizeNameList(data.allergens),
      drinkLabel: String(data.drinkLabel ?? 'Drinks'),
      dessertLabel: String(data.dessertLabel ?? 'Desserts'),
      snackLabel: String(data.snackLabel ?? 'Snacks'),
    }
  }

  async function pullOnce() {
    try {
      const url = fid
        ? `/api/menu?flightId=${encodeURIComponent(fid)}`
        : '/api/menu'
      const res = await fetch(url)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.message || 'Could not subscribe to menu.')
      if (stopped) return
      const mapped = Array.isArray(payload?.items) ? payload.items.map(normalizeFromApi) : []
      onData(
        fid ? mapped.filter((item) => menuItemMatchesActiveFlight(item.flightId, fid)) : mapped,
      )
    } catch (error) {
      if (!stopped) onError(error)
    }
  }

  void pullOnce()
  const timer = setInterval(() => {
    void pullOnce()
  }, 5000)

  return () => {
    stopped = true
    clearInterval(timer)
  }
}

function shapePayload(payload) {
  const category = 'meal'
  const drinkIds = normalizeIdList(payload.drinkIds)
  const dessertIds = normalizeIdList(payload.dessertIds)
  const snackIds = normalizeIdList(payload.snackIds)
  const drinkOptions = normalizeNameList(payload.drinkOptions)
  const dessertOptions = normalizeNameList(payload.dessertOptions)
  const snackOptions = normalizeNameList(payload.snackOptions)
  const allergens = normalizeNameList(payload.allergens)

  return {
    name: String(payload.name ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    imageUrl: String(payload.imageUrl ?? '').trim(),
    color: String(payload.color ?? '#3b82f6').trim(),
    stock: normalizeStock(payload.stock),
    category,
    drinkIds,
    dessertIds,
    snackIds,
    drinkOptions,
    dessertOptions,
    snackOptions,
    allergens,
    drinkLabel: String(payload.drinkLabel ?? 'Drinks').trim() || 'Drinks',
    dessertLabel: String(payload.dessertLabel ?? 'Desserts').trim() || 'Desserts',
    snackLabel: String(payload.snackLabel ?? 'Snacks').trim() || 'Snacks',
  }
}

export async function createMenuMeal(payload, flightInstanceId) {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.')
  const base = shapePayload(payload)
  if (!base.name) throw new Error('Meal name is required.')
  const tokenResult = await auth?.currentUser?.getIdTokenResult(true)
  const token = tokenResult?.token
  if (!token) throw new Error('Login required.')
  
  // Add flightInstanceId to the payload for backend
  const payloadWithFlight = {
    ...base,
    flightInstanceId: String(flightInstanceId ?? '').trim()
  }
  
  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadWithFlight),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Could not create menu item.')
  }
  return await res.json().catch(() => ({}))
}

export async function updateMenuMeal(id, payload, flightInstanceId) {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.')
  const base = shapePayload(payload)
  if (!base.name) throw new Error('Meal name is required.')
  const tokenResult = await auth?.currentUser?.getIdTokenResult(true)
  const token = tokenResult?.token
  if (!token) throw new Error('Login required.')
  
  // Add flightInstanceId to the payload for backend
  const payloadWithFlight = {
    ...base,
    flightInstanceId: String(flightInstanceId ?? '').trim()
  }
  
  const res = await fetch(`/api/menu/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadWithFlight),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Could not update menu item.')
  }
  return await res.json().catch(() => ({}))
}

export async function deleteMenuMeal(id, imageUrl) {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.')
  const tokenResult = await auth?.currentUser?.getIdTokenResult(true)
  const token = tokenResult?.token
  if (!token) throw new Error('Login required.')
  const res = await fetch(`/api/menu/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Could not delete menu item.')
  }
  void imageUrl
}
