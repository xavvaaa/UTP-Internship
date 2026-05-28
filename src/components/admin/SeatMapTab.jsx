import { useMemo, useState } from 'react'
import styles from './SeatMapTab.module.css'

const BUSINESS_ROWS = Array.from({ length: 3 }, (_x, i) => i + 1)
const ECONOMY_ROWS = Array.from({ length: 28 }, (_x, i) => i + 4)
const LEFT = ['A', 'B', 'C']
const RIGHT = ['D', 'E', 'F']

export default function SeatMapTab({ orders, menuItems }) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const seatMap = useMemo(() => {
    const map = new Map()
    for (const order of orders) {
      map.set(order.seatNumber, order)
    }
    return map
  }, [orders])

  const getMealColor = (mealName) => {
    const meal = menuItems?.find(item => item.name === mealName)
    return meal?.color || '#3b82f6'
  }

  const renderSeatButton = (seat, order, isBusiness) => {
    const status = order?.status || 'empty'
    return (
      <button
        key={seat}
        type="button"
        className={`${styles.seat} ${styles[status] || ''} ${isBusiness ? styles.businessSeat : ''}`}
        onClick={() => setSelectedOrder(order ? { ...order, seat } : { seat, status: 'empty' })}
      >
        <strong>{seat}</strong>
        {showDetails && order ? (
          <span className={styles.meta}>
            <span className={styles.mealColor} style={{ backgroundColor: getMealColor(order.meal) }}></span>
            {order.orderId} {short(order.meal)}
          </span>
        ) : null}
      </button>
    )
  }

  const renderSeatRow = (row, isBusiness = false) => (
    <div key={row} className={`${styles.row} ${isBusiness ? styles.businessRow : ''}`}>
      {LEFT.map((col) => renderSeatButton(`${row}${col}`, seatMap.get(`${row}${col}`), isBusiness))}
      <div className={styles.rowNumber}>{row}</div>
      {RIGHT.map((col) => renderSeatButton(`${row}${col}`, seatMap.get(`${row}${col}`), isBusiness))}
    </div>
  )

  return (
    <section className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Seat Map</h2>
          <p className={styles.subtitle}>Select a seat to view the passenger order and status.</p>
        </div>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
          Show Order Details
        </label>
      </div>
      <div className={styles.airplane}>
        {/* Column Labels */}
        <div className={styles.columnLabels}>
          <div>A</div>
          <div>B</div>
          <div>C</div>
          <div></div>
          <div>D</div>
          <div>E</div>
          <div>F</div>
        </div>

        {/* Cockpit */}
        <div className={styles.cockpit}>
          <div className={styles.cockpitShape}>
            <span className={styles.cockpitLabel}>Cockpit</span>
          </div>
        </div>

        {/* Business Class */}
        <div className={styles.businessClass}>
          <div className={styles.classLabel}>Business Class</div>
          <div className={styles.grid}>
            {BUSINESS_ROWS.map(row => renderSeatRow(row, true))}
          </div>
        </div>

        {/* Economy Class */}
        <div className={styles.economyClass}>
          <div className={styles.classLabel}>Economy Class</div>
          <div className={styles.grid}>
            {ECONOMY_ROWS.map(row => renderSeatRow(row, false))}
          </div>
        </div>

        {/* Back of Plane */}
        <div className={styles.backOfPlane}>
          <div className={styles.backOfPlaneLayout}>
            {/* Left Restroom */}
            <div className={styles.restroom}>
              <div className={styles.restroomIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M9 11v7"/>
                  <path d="M5 11v7"/>
                  <circle cx="15" cy="9" r="2"/>
                  <path d="M15 11v7"/>
                  <path d="M19 11v7"/>
                </svg>
              </div>
              <span className={styles.restroomLabel}>Restroom</span>
            </div>

            {/* Empty spaces */}
            <div></div>
            <div></div>
            <div></div>
            <div></div>

            {/* Right Restroom in column F */}
            <div className={styles.restroom} style={{ gridColumn: '7' }}>
              <div className={styles.restroomIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M9 11v7"/>
                  <path d="M5 11v7"/>
                  <circle cx="15" cy="9" r="2"/>
                  <path d="M15 11v7"/>
                  <path d="M19 11v7"/>
                </svg>
              </div>
              <span className={styles.restroomLabel}>Restroom</span>
            </div>
          </div>

          {/* Second row for galley */}
          <div className={styles.backOfPlaneLayout}>
            {/* Empty spaces */}
            <div></div>
            <div></div>

            {/* Galley in columns C-middle-D */}
            <div className={styles.galley}>
              <div className={styles.galleyIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h16v12H8z"/>
                  <path d="M12 8v4"/>
                  <path d="M20 8v4"/>
                  <path d="M10 16h12"/>
                  <path d="M14 20h4"/>
                  <path d="M12 24v2"/>
                  <path d="M20 24v2"/>
                </svg>
              </div>
              <span className={styles.galleyLabel}>Galley</span>
            </div>

            {/* Empty spaces */}
            <div></div>
            <div></div>
          </div>
          
          {/* Back of Plane Label */}
          <div className={styles.backPlaneLabel}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3v14M7 6l3-3 3 3M7 14l3 3 3-3"/>
            </svg>
            <span>BACK OF THE PLANE</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3v14M7 6l3-3 3 3M7 14l3 3 3-3"/>
            </svg>
          </div>
        </div>
      </div>
      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Seat {selectedOrder.seat}</h3>
            <div className={styles.modalContent}>
              {selectedOrder.status === 'empty' ? (
                <p className={styles.emptyMessage}>No order for this seat.</p>
              ) : (
                <div className={styles.modalDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Order ID:</span>
                    <span className={styles.detailValue}>#{selectedOrder.orderId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Meal:</span>
                    <span className={styles.detailValue}>{selectedOrder.meal || 'N/A'}</span>
                  </div>
                  {selectedOrder.drink && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Drink:</span>
                      <span className={styles.detailValue}>{selectedOrder.drink}</span>
                    </div>
                  )}
                  {selectedOrder.dessert && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Dessert:</span>
                      <span className={styles.detailValue}>{selectedOrder.dessert}</span>
                    </div>
                  )}
                  {selectedOrder.snack && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Snack:</span>
                      <span className={styles.detailValue}>{selectedOrder.snack}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Status:</span>
                    <span className={`${styles.detailValue} ${styles[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              )}
              <button type="button" className={styles.close} onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function short(value) {
  const raw = String(value ?? '')
  if (raw.length <= 16) return raw
  return `${raw.slice(0, 15)}...`
}
