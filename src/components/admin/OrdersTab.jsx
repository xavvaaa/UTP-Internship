import { useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { getNextOrderStatus } from '../../services/admin/ordersAdminService'
import styles from './OrdersTab.module.css'

function fmtTime(ts) {
  if (!ts) return 'N/A'
  const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts)
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString()
}

export default function OrdersTab({ orders, menuItems, sortMode, onSortChange, updatingOrderId, onAdvance }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const getMealColor = (mealName) => {
    const meal = menuItems?.find(item => item.name === mealName)
    return meal?.color || '#3b82f6'
  }

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      delivered: orders.filter((order) => order.status === 'delivered').length,
    }),
    [orders],
  )

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (!query) return true

      return [
        order.orderId,
        order.seatNumber,
        order.meal,
        order.drink,
        order.dessert,
        order.snack,
        order.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [orders, searchQuery, statusFilter])

  const filtersActive = searchQuery.trim() || statusFilter !== 'all'

  return (
    <div className={styles.container}>
      <div className={styles.summaryGrid} aria-label="Order summary">
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{summary.total}</span>
          <span className={styles.summaryLabel}>Orders</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.pendingSummary}`}>
          <span className={styles.summaryValue}>{summary.pending}</span>
          <span className={styles.summaryLabel}>Pending</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.preparingSummary}`}>
          <span className={styles.summaryValue}>{summary.preparing}</span>
          <span className={styles.summaryLabel}>Preparing</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.deliveredSummary}`}>
          <span className={styles.summaryValue}>{summary.delivered}</span>
          <span className={styles.summaryLabel}>Delivered</span>
        </div>
      </div>

      <div className={styles.controls} aria-label="Order list controls">
        <label className={styles.searchControl}>
          <span>Find</span>
          <div className={styles.searchInputWrap}>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Seat, order, meal, option"
            />
          </div>
        </label>
        <label className={styles.filterControl}>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => onSortChange(event.target.value)}>
            <option value="seat">Seat</option>
            <option value="status">Status</option>
            <option value="time">Time</option>
          </select>
        </label>
        {filtersActive ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className={styles.ordersList}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No orders yet</strong>
            <p>New passenger orders will appear here automatically.</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No matching orders</strong>
            <p>Try another seat, meal, or status.</p>
            <button
              type="button"
              className={styles.emptyAction}
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          visibleOrders.map((order) => {
            const next = getNextOrderStatus(order.status)
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderIdentity}>
                    <span className={styles.seatNumber}>{order.seatNumber || 'N/A'}</span>
                    <div>
                      <div className={styles.orderId}>Order #{order.orderId}</div>
                      <div className={styles.orderTime}>{fmtTime(order.timestamp)}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.orderDetails}>
                  <div className={styles.mealRow}>
                    <span className={styles.detailLabel}>Meal</span>
                    <div className={styles.mealValue}>
                      {order.meal && (
                        <span className={styles.mealColorIndicator} style={{ backgroundColor: getMealColor(order.meal) }}></span>
                      )}
                      <strong>{order.meal || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className={styles.optionList}>
                    {order.drink && <span className={styles.optionChip}>Drink: {order.drink}</span>}
                    {order.dessert && <span className={styles.optionChip}>Dessert: {order.dessert}</span>}
                    {order.snack && <span className={styles.optionChip}>Snack: {order.snack}</span>}
                    {!order.drink && !order.dessert && !order.snack && (
                      <span className={styles.noOptions}>No additional options</span>
                    )}
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <span className={styles.nextStep}>
                    {next ? `Next: ${next}` : 'Order complete'}
                  </span>
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
