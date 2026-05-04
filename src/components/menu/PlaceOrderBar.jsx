/**
 * Sticky primary action for submitting the single selected meal.
 */
import { Loader2, ShoppingBag } from 'lucide-react'
import styles from './PlaceOrderBar.module.css'

export default function PlaceOrderBar({ disabled, loading, onPlaceOrder, lockedMessage }) {
  if (lockedMessage) {
    return (
      <div className={styles.bar}>
        <p className={styles.locked}>{lockedMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.button}
        disabled={disabled || loading}
        onClick={onPlaceOrder}
      >
        {loading ? (
          <>
            <Loader2 className={styles.spin} size={20} aria-hidden />
            Placing order
          </>
        ) : (
          <>
            <ShoppingBag size={20} aria-hidden />
            Place order
          </>
        )}
      </button>
    </div>
  )
}
