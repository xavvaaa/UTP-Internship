/**
 * Real-time order list for cabin crew status updates.
 */
import { Loader2 } from 'lucide-react'
import { getNextOrderStatus } from '../../services/admin/ordersAdminService'
import styles from './AdminOrdersList.module.css'

export default function AdminOrdersList({ orders, updatingOrderId, onAdvance }) {
  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>Orders</h2>
      <ul className={styles.list}>
        {orders.map((order) => {
          const next = getNextOrderStatus(order.status)
          return (
            <li key={order.id} className={styles.card}>
              <div className={styles.row}>
                <span className={styles.label}>Seat</span>
                <strong>{order.seatNumber || 'N/A'}</strong>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Meal</span>
                <strong>{order.meal || 'N/A'}</strong>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Status</span>
                <span className={`${styles.status} ${styles[order.status] || ''}`}>{order.status}</span>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() => onAdvance(order)}
                disabled={!next || updatingOrderId === order.id}
              >
                {updatingOrderId === order.id ? (
                  <>
                    <Loader2 size={14} className={styles.spin} aria-hidden />
                    Updating
                  </>
                ) : next ? (
                  `${order.status} -> ${next}`
                ) : (
                  'Delivered'
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
