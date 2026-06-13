/**
 * Live order status for the current passenger session.
 */
import { CheckCircle2, ChefHat, Clock3, Plane } from 'lucide-react'
import styles from './StatusTracker.module.css'

const STEPS = [
  { key: 'pending', label: 'Order placed', icon: Clock3 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function getOrderTitle(order) {
  const meal = String(order?.meal ?? '').trim()
  if (meal) return meal
  return 'Your order'
}

function getOrderExtras(order) {
  return [order?.drink, order?.dessert, order?.snack].filter(Boolean).join(' · ')
}

function resolveMealImage(order, menuItems) {
  if (!order || !Array.isArray(menuItems) || !menuItems.length) return ''

  const mealId = String(order.mealId ?? '').trim()
  if (mealId) {
    const byId = menuItems.find((item) => item.id === mealId)
    if (byId?.imageUrl) return byId.imageUrl
  }

  const mealName = String(order.meal ?? '').trim().toLowerCase()
  if (mealName) {
    const byName = menuItems.find(
      (item) => String(item.name ?? '').trim().toLowerCase() === mealName,
    )
    if (byName?.imageUrl) return byName.imageUrl
  }

  return ''
}

export default function StatusTracker({ order, menuItems = [] }) {
  if (!order) return null

  const imageUrl = resolveMealImage(order, menuItems)
  const status = String(order.status ?? 'pending').toLowerCase()
  const isDelivered = status === 'delivered'
  const visibleSteps = isDelivered ? STEPS.filter((s) => s.key === 'delivered') : STEPS
  const activeIdx = isDelivered
    ? 0
    : Math.max(
        0,
        STEPS.findIndex((s) => s.key === status),
      )
  const extras = getOrderExtras(order)

  return (
    <section className={styles.wrap} aria-label="Order status">
      {imageUrl ? (
        <div className={styles.hero}>
          <img className={styles.heroImg} src={imageUrl} alt="" />
        </div>
      ) : null}
      <div className={styles.head}>
        <div>
          <span className={styles.kicker}>Live order status</span>
          <h3>{getOrderTitle(order)}</h3>
        </div>
        <Plane size={18} aria-hidden />
      </div>
      {extras ? <p className={styles.items}>{extras}</p> : null}
      {order.notes ? (
        <div className={styles.notes}>
          <span>Notes</span>
          <p>{order.notes}</p>
        </div>
      ) : null}
      <ol className={`${styles.track} ${isDelivered ? styles.trackDelivered : ''}`}>
        {visibleSteps.map((step, i) => {
          const Icon = step.icon
          const isActive = isDelivered || i === activeIdx
          return (
            <li
              key={step.key}
              className={`${styles.step} ${isActive ? styles[`stepActive_${step.key}`] : ''} ${isDelivered ? styles.stepDelivered : ''}`}
            >
              <span className={styles.stepIcon}>
                <Icon size={15} aria-hidden />
              </span>
              {step.label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
