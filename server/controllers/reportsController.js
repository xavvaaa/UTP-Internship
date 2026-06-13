import { adminDb } from '../firebaseAdmin.js'

export async function getFlightReport(req, res) {
  const activeFlightId = String(req.userFlightId ?? '').trim()
  try {
    let q = adminDb.collection('orders')
    if (activeFlightId) q = q.where('flightId', '==', activeFlightId)
    const snap = await q.get()
    const orders = snap.docs.map((doc) => doc.data())
    const byStatus = orders.reduce(
      (acc, order) => {
        const key = String(order.status ?? 'pending').toLowerCase()
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      { pending: 0, preparing: 0, delivered: 0 },
    )
    const byMeal = orders.reduce((acc, order) => {
      const key = String(order.meal ?? 'Unknown')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const byCategory = {
      meal: orders.filter((o) => o.meal).length,
      drink: orders.filter((o) => o.drink).length,
      dessert: orders.filter((o) => o.dessert).length,
      snack: orders.filter((o) => o.snack).length,
    }
    return res.json({
      ok: true,
      summary: {
        total: orders.length,
        byStatus,
        byMeal,
        byCategory,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error?.message || 'Could not load report.' })
  }
}
