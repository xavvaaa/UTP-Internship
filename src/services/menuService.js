/**
 * Passenger menu feed via backend API.
 */
import { firebaseConfigured } from '../firebase/config'
import { menuItemMatchesActiveFlight } from '../utils/flightId'

const CATEGORIES = ['meal', 'drink', 'dessert', 'snack']

function normalizeIdList(value) {
  if (!Array.isArray(value)) return null
  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function normalizeNameList(value) {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function normalize(item = {}) {
  const m = item
  const stock = Math.max(0, Math.floor(Number(m.stock ?? 0)))
  const available = m.available !== false && stock > 0
  const category = String(m.category ?? 'meal').toLowerCase()
  return {
    id: String(m.id ?? ''),
    name: String(m.name ?? 'Item'),
    description: String(m.description ?? ''),
    imageUrl: String(m.imageUrl ?? m.image ?? ''),
    category: CATEGORIES.includes(category) ? category : 'meal',
    stock,
    flightId: String(m.flightId ?? ''),
    available,
    drinkIds: normalizeIdList(m.drinkIds),
    dessertIds: normalizeIdList(m.dessertIds),
    snackIds: normalizeIdList(m.snackIds),
    drinkOptions: normalizeNameList(m.drinkOptions),
    dessertOptions: normalizeNameList(m.dessertOptions),
    snackOptions: normalizeNameList(m.snackOptions),
    allergens: normalizeNameList(m.allergens),
    drinkLabel: String(m.drinkLabel ?? 'Drinks'),
    dessertLabel: String(m.dessertLabel ?? 'Desserts'),
    snackLabel: String(m.snackLabel ?? 'Snacks'),
  }
}

export function isItemSelectable(item) {
  return item.stock > 0 && item.available
}

export function subscribeMenu(onData, onError, flightInstanceId) {
  if (!firebaseConfigured) {
    onData([])
    return () => {}
  }

  const fid = String(flightInstanceId ?? '').trim()
  let stopped = false

  async function pullOnce() {
    try {
      const url = fid
        ? `/api/menu?flightId=${encodeURIComponent(fid)}`
        : '/api/menu'
      const res = await fetch(url)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.message || 'Could not load menu.')
      if (stopped) return
      const mapped = Array.isArray(payload?.items) ? payload.items.map(normalize) : []
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
