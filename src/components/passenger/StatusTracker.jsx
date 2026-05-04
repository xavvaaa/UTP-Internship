/**
 * Live order status for the current session.
 */
import { Plane } from 'lucide-react'
import styles from './StatusTracker.module.css'

const STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'delivered', label: 'Delivered' },
]

export default function StatusTracker({ order }) {
  if (!order) return null

  const idx = STEPS.findIndex((s) => s.key === order.status)
  const activeIdx = idx >= 0 ? idx : 0

  return (
    <section className={styles.wrap} aria-label="Order status">
      <div className={styles.head}>
        <Plane size={16} aria-hidden />
        <span>Order {order.orderId}</span>
      </div>
      <p className={styles.items}>
        {[order.meal, order.drink, order.dessert, order.snack].filter(Boolean).join(' · ') || 'Order'}
      </p>
      <ol className={styles.track}>
        {STEPS.map((step, i) => (
          <li
            key={step.key}
            className={`${styles.step} ${i <= activeIdx ? styles.done : ''} ${i === activeIdx ? styles.current : ''}`}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </section>
  )
}
