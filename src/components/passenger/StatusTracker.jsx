/**
 * Live order status for the current passenger session.
 */
import { CheckCircle2, ChefHat, Clock3, Plane } from 'lucide-react'
import styles from './StatusTracker.module.css'

const STEPS = [
  { key: 'pending', label: 'Received', icon: Clock3 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

export default function StatusTracker({ order }) {
  if (!order) return null

  const idx = STEPS.findIndex((s) => s.key === order.status)
  const activeIdx = idx >= 0 ? idx : 0

  return (
    <section className={styles.wrap} aria-label="Order status">
      <div className={styles.head}>
        <div>
          <span className={styles.kicker}>Live order status</span>
          <h3>Order {order.orderId}</h3>
        </div>
        <Plane size={18} aria-hidden />
      </div>
      <p className={styles.items}>
        {[order.meal, order.drink, order.dessert, order.snack].filter(Boolean).join(' - ') || 'Order'}
      </p>
      <ol className={styles.track}>
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <li
              key={step.key}
              className={`${styles.step} ${i <= activeIdx ? styles.done : ''} ${i === activeIdx ? styles.current : ''}`}
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
