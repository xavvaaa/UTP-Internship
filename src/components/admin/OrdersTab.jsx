import { Loader2 } from 'lucide-react'
import { getNextOrderStatus } from '../../services/admin/ordersAdminService'
import styles from './OrdersTab.module.css'

function fmtTime(ts) {
  if (!ts) return 'N/A'
  const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts)
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString()
}

export default function OrdersTab({ orders, menuItems, sortMode, onSortChange, updatingOrderId, onAdvance }) {
  const getMealColor = (mealName) => {
    const meal = menuItems?.find(item => item.name === mealName)
    return meal?.color || '#3b82f6'
  }
  return (
    <div className={styles.container}>
      {/* Header with Sort Controls */}
      <div className={styles.header}>
        <h2 className={styles.title}>Orders</h2>
        <div className={styles.sortControls}>
          <label className={styles.sortLabel}>
            Sort by:
            <select
              className={styles.sortSelect}
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="seat">Seat</option>
              <option value="status">Status</option>
              <option value="time">Time</option>
            </select>
          </label>
        </div>
      </div>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map((order) => {
            const next = getNextOrderStatus(order.status)
            return (
              <div key={order.id} className={styles.orderCard}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderId}>#{order.orderId}</div>
                  <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {order.status}
                  </div>
                </div>

                {/* Order Details */}
                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Seat:</span>
                    <span className={styles.detailValue}>{order.seatNumber || 'N/A'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Meal:</span>
                    <div className={styles.detailValueWithColor}>
                      {order.meal && (
                        <span className={styles.mealColorIndicator} style={{ backgroundColor: getMealColor(order.meal) }}></span>
                      )}
                      <span>{order.meal || 'N/A'}</span>
                    </div>
                  </div>
                  {order.drink && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Drink:</span>
                      <span className={styles.detailValue}>{order.drink}</span>
                    </div>
                  )}
                  {order.dessert && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Dessert:</span>
                      <span className={styles.detailValue}>{order.dessert}</span>
                    </div>
                  )}
                  {order.snack && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Snack:</span>
                      <span className={styles.detailValue}>{order.snack}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Time:</span>
                    <span className={styles.detailValue}>{fmtTime(order.timestamp)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className={styles.orderActions}>
                  <button
                    type="button"
                    className={styles.advanceButton}
                    onClick={() => onAdvance(order)}
                    disabled={!next || updatingOrderId === order.id}
                  >
                    {updatingOrderId === order.id ? (
                      <>
                        <Loader2 size={16} className={styles.spin} />
                        Updating...
                      </>
                    ) : next ? (
                      `Mark as ${next}`
                    ) : (
                      'Delivered'
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
