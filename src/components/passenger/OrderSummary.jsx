/**
 * Selected meal, drink, dessert, snack before submit.
 */
import { ClipboardList } from 'lucide-react'
import styles from './OrderSummary.module.css'

export default function OrderSummary({ seatNumber, meal, drink, dessert, snack }) {
  const hasAny = meal || drink || dessert || snack
  if (!hasAny) return null

  return (
    <section className={styles.wrap} aria-label="Order summary">
      <div className={styles.head}>
        <ClipboardList size={16} aria-hidden />
        <span>Your selections</span>
      </div>
      {seatNumber ? <p className={styles.meta}>Seat {seatNumber}</p> : null}
      <ul className={styles.list}>
        {meal ? (
          <li>
            <span className={styles.label}>Meal</span> {meal}
          </li>
        ) : null}
        {drink ? (
          <li>
            <span className={styles.label}>Drink</span> {drink}
          </li>
        ) : null}
        {dessert ? (
          <li>
            <span className={styles.label}>Dessert</span> {dessert}
          </li>
        ) : null}
        {snack ? (
          <li>
            <span className={styles.label}>Snack</span> {snack}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
