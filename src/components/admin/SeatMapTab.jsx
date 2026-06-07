import { useMemo, useState } from 'react'
import { DEFAULT_SEAT_LAYOUT_ID, getSeatLayout } from '../../data/seatLayouts'
import styles from './SeatMapTab.module.css'

export default function SeatMapTab({ orders, menuItems, session }) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const layout = getSeatLayout(session?.seat_layout_id || DEFAULT_SEAT_LAYOUT_ID)
  const maxSections = Math.max(...layout.cabins.flatMap((cabin) => cabin.rows.map((row) => row.sections.length)))
  const maxSeatsPerSection = Array.from({ length: maxSections }, (_value, index) =>
    Math.max(...layout.cabins.flatMap((cabin) => cabin.rows.map((row) => row.sections[index]?.length || 0))),
  )
  const seatGridTemplateColumns = buildSeatGridColumns(maxSeatsPerSection)
  const rowGridTemplateColumns = `minmax(42px, 0.75fr) ${seatGridTemplateColumns}`
  const sectionLabels = buildSectionLabels(layout, maxSections)
  const totalSeats = useMemo(
    () =>
      layout.cabins.reduce(
        (sum, cabin) => sum + cabin.rows.reduce((rowSum, row) => rowSum + row.sections.flat().length, 0),
        0,
      ),
    [layout],
  )

  const seatMap = useMemo(() => {
    const map = new Map()
    for (const order of orders) {
      map.set(String(order.seatNumber ?? '').toUpperCase(), order)
    }
    return map
  }, [orders])

  const summary = useMemo(
    () => ({
      total: orders.length,
      empty: Math.max(0, totalSeats - orders.length),
      pending: orders.filter((order) => order.status === 'pending').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      delivered: orders.filter((order) => order.status === 'delivered').length,
    }),
    [orders, totalSeats],
  )

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
    <div key={row.number} className={`${styles.row} ${isBusiness ? styles.businessRow : ''}`} style={{ gridTemplateColumns: rowGridTemplateColumns }}>
      <div className={styles.rowNumber}>{row.number}</div>
      {sectionLabels.flatMap((labels, sectionIndex) => {
        const section = row.sections[sectionIndex] || []
        return [
        ...labels.map((col) =>
          section.includes(col) ? (
            renderSeatButton(`${row.number}${col}`, seatMap.get(`${row.number}${col}`), isBusiness)
          ) : (
            <div key={`${row.number}${col}-empty`} className={styles.seatSpace}></div>
          ),
        ),
        sectionIndex < sectionLabels.length - 1 ? (
          <div key={`${row.number}-aisle-${sectionIndex}`} className={styles.aisle}></div>
        ) : null,
      ]})}
    </div>
  )

  return (
    <section className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Seat Map</h2>
          <p className={styles.subtitle}>
            {layout.name} ({layout.aircraftType}) - {layout.description}
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <span className={styles.liveBadge}>Live orders</span>
          <label className={styles.toggle}>
            <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
            Order details
          </label>
        </div>
      </div>

      <div className={styles.overview} aria-label="Seat map order summary">
        <div className={styles.metric}>
          <span className={styles.metricValue}>{summary.total}</span>
          <span className={styles.metricLabel}>Orders</span>
        </div>
        <div className={`${styles.metric} ${styles.pendingMetric}`}>
          <span className={styles.metricValue}>{summary.pending}</span>
          <span className={styles.metricLabel}>Pending</span>
        </div>
        <div className={`${styles.metric} ${styles.preparingMetric}`}>
          <span className={styles.metricValue}>{summary.preparing}</span>
          <span className={styles.metricLabel}>Preparing</span>
        </div>
        <div className={`${styles.metric} ${styles.deliveredMetric}`}>
          <span className={styles.metricValue}>{summary.delivered}</span>
          <span className={styles.metricLabel}>Delivered</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{summary.empty}</span>
          <span className={styles.metricLabel}>No order</span>
        </div>
      </div>

      <div className={styles.airplane}>
        {/* Column Labels */}
        <div className={styles.columnLabels} style={{ gridTemplateColumns: rowGridTemplateColumns }}>
          <div>Row</div>
          {sectionLabels.flatMap((section, sectionIndex) => [
            ...section.map((col) => <div key={`${sectionIndex}-${col}`}>{col}</div>),
            sectionIndex < sectionLabels.length - 1 ? <div key={`aisle-${sectionIndex}`}></div> : null,
          ])}
        </div>

        {/* Cockpit */}
        <div className={styles.cockpit}>
          <div className={styles.cockpitShape}>
            <span className={styles.cockpitLabel}>Cockpit</span>
          </div>
        </div>

        {layout.cabins.map((cabin) => (
          <div key={cabin.name} className={styles.cabinClass}>
            <div className={styles.classLabel}>{cabin.name}</div>
            <div className={styles.grid}>
              {cabin.rows.map(row => renderSeatRow(row, cabin.premium))}
            </div>
          </div>
        ))}

        {/* Back of Plane */}
        <div className={styles.backOfPlane}>
          <div className={styles.backOfPlaneLayout} style={{ gridTemplateColumns: seatGridTemplateColumns }}>
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
            {Array.from({ length: Math.max(1, maxSeatsPerSection.reduce((sum, count) => sum + count, 0) - 1) }).map((_value, index) => (
              <div key={`rear-space-${index}`}></div>
            ))}

            {/* Right Restroom in column F */}
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
          </div>

          {/* Second row for galley */}
          <div className={styles.backOfPlaneLayout} style={{ gridTemplateColumns: seatGridTemplateColumns }}>
            {/* Empty spaces */}
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
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Seat {selectedOrder.seat}</h3>
                <p className={styles.modalSubtitle}>{selectedOrder.status === 'empty' ? 'No active order' : 'Passenger order'}</p>
              </div>
              <span className={`${styles.statusPill} ${styles[selectedOrder.status]}`}>{selectedOrder.status}</span>
            </div>
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
                    <span className={styles.detailLabel}>Flight ID:</span>
                    <span className={styles.detailValue}>{selectedOrder.flightId || selectedOrder.sessionId || 'N/A'}</span>
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
                    <span className={styles.detailLabel}>Updated:</span>
                    <span className={styles.detailValue}>{formatTime(selectedOrder.updatedAt || selectedOrder.timestamp)}</span>
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

function buildSeatGridColumns(sectionWidths) {
  const columns = []
  sectionWidths.forEach((width, index) => {
    for (let i = 0; i < width; i += 1) columns.push('minmax(46px, 1fr)')
    if (index < sectionWidths.length - 1) columns.push('minmax(38px, 0.8fr)')
  })
  columns.push('minmax(38px, 0.8fr)')
  return columns.join(' ')
}

function buildSectionLabels(layout, maxSections) {
  return Array.from({ length: maxSections }, (_value, sectionIndex) =>
    layout.cabins
      .flatMap((cabin) => cabin.rows.map((row) => row.sections[sectionIndex] || []))
      .sort((a, b) => b.length - a.length)[0] || [],
  )
}

function short(value) {
  const raw = String(value ?? '')
  if (raw.length <= 16) return raw
  return `${raw.slice(0, 15)}...`
}

function formatTime(value) {
  if (!value) return 'N/A'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  if (value instanceof Date) return value.toLocaleString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString()
}
