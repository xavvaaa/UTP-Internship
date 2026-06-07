import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DEFAULT_SEAT_LAYOUT_ID, getSeatLayout } from '../../data/seatLayouts'
import { ORDER_STATUSES } from '../../services/admin/ordersAdminService'
import styles from './SeatMapTab.module.css'

export default function SeatMapTab({ orders, menuItems, session, updatingOrderId, onStatusChange }) {
  const layoutId = session?.seat_layout_id || DEFAULT_SEAT_LAYOUT_ID
  const [showDetails, setShowDetails] = useState(false)
  const [selectedSeatState, setSelectedSeatState] = useState({ layoutId, seat: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mealFilter, setMealFilter] = useState('all')
  const [cabinFilter, setCabinFilter] = useState('all')
  const layout = getSeatLayout(layoutId)
  const selectedSeat = selectedSeatState?.layoutId === layoutId ? selectedSeatState.seat : ''
  const maxSections = Math.max(...layout.cabins.flatMap((cabin) => cabin.rows.map((row) => row.sections.length)))
  const maxSeatsPerSection = Array.from({ length: maxSections }, (_value, index) =>
    Math.max(...layout.cabins.flatMap((cabin) => cabin.rows.map((row) => row.sections[index]?.length || 0))),
  )
  const seatGridTemplateColumns = buildSeatGridColumns(maxSeatsPerSection)
  const sectionLabels = buildSectionLabels(layout, maxSections)
  const cabinOptions = layout.cabins.map((cabin) => cabin.name)
  const orderedMealOptions = useMemo(
    () =>
      Array.from(new Set(orders.map((order) => order.meal).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [orders],
  )
  const totalSeats = layout.cabins.reduce(
    (sum, cabin) => sum + cabin.rows.reduce((rowSum, row) => rowSum + row.sections.flat().length, 0),
    0,
  )
  const seatCabinMap = new Map()
  for (const cabin of layout.cabins) {
    for (const row of cabin.rows) {
      for (const col of row.sections.flat()) {
        seatCabinMap.set(`${row.number}${col}`, cabin.name)
      }
    }
  }

  const seatMap = useMemo(() => {
    const map = new Map()
    for (const order of orders) {
      map.set(String(order.seatNumber ?? '').toUpperCase(), order)
    }
    return map
  }, [orders])

  const selectedOrder = selectedSeat ? seatMap.get(selectedSeat) || null : null
  const selectedSeatInfo = selectedSeat
    ? { ...(selectedOrder || {}), seat: selectedSeat, status: selectedOrder?.status || 'empty' }
    : null
  const selectedOrderUpdating = selectedOrder && updatingOrderId === selectedOrder.id

  const summary = {
    total: orders.length,
    empty: Math.max(0, totalSeats - orders.length),
    pending: orders.filter((order) => order.status === 'pending').length,
    preparing: orders.filter((order) => order.status === 'preparing').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
  }

  const filteredOrderCount = orders.filter((order) => seatMatchesFilters(order.seatNumber, order)).length
  const filtersActive = search.trim() || statusFilter !== 'all' || mealFilter !== 'all' || cabinFilter !== 'all'

  const getMealColor = (mealName) => {
    const meal = menuItems?.find(item => item.name === mealName)
    return meal?.color || '#3b82f6'
  }

  const renderSeatButton = (seat, order, isBusiness) => {
    const status = order?.status || 'empty'
    const matchesFilters = seatMatchesFilters(seat, order)
    const isSelected = selectedSeat === seat
    return (
      <button
        key={seat}
        type="button"
        className={`${styles.seat} ${styles[status] || ''} ${isBusiness ? styles.businessSeat : ''} ${isSelected ? styles.selectedSeat : ''} ${!matchesFilters ? styles.dimmedSeat : ''}`}
        onClick={() => setSelectedSeatState({ layoutId, seat })}
        title={order ? `${seat} - ${order.meal || 'Order'} - ${status}` : `${seat} - no order`}
      >
        {order?.meal ? (
          <span className={styles.mealStripe} style={{ backgroundColor: getMealColor(order.meal) }}></span>
        ) : null}
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

  function seatMatchesFilters(seat, order) {
    const query = search.trim().toUpperCase()
    const cabin = seatCabinMap.get(String(seat ?? '').toUpperCase()) || ''
    const status = order?.status || 'empty'

    if (statusFilter !== 'all' && status !== statusFilter) return false
    if (mealFilter !== 'all' && order?.meal !== mealFilter) return false
    if (cabinFilter !== 'all' && cabin !== cabinFilter) return false
    if (!query) return true

    const searchable = [
      seat,
      order?.orderId,
      order?.meal,
      order?.drink,
      order?.dessert,
      order?.snack,
      status,
      cabin,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase()

    return searchable.includes(query)
  }

  const renderSeatRow = (row, isBusiness = false) => (
    <div key={row.number} className={`${styles.row} ${isBusiness ? styles.businessRow : ''}`} style={{ gridTemplateColumns: seatGridTemplateColumns }}>
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
        <div className={styles.aircraftSummary}>
          <span className={styles.aircraftName}>{layout.name}</span>
          <span className={styles.aircraftMeta}>
            {layout.aircraftType} - {layout.description}
          </span>
        </div>
        <div className={styles.toolbarActions}>
          <span className={styles.liveBadge}>Live orders</span>
          <label className={styles.toggle}>
            <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
            Order details
          </label>
        </div>
      </div>

      <div className={styles.controls} aria-label="Seat map filters">
        <label className={styles.searchBox}>
          <span>Find</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Seat, order, meal"
          />
        </label>
        <label className={styles.filterControl}>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="delivered">Delivered</option>
            <option value="empty">No order</option>
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Meal</span>
          <select value={mealFilter} onChange={(event) => setMealFilter(event.target.value)}>
            <option value="all">All meals</option>
            {orderedMealOptions.map((meal) => (
              <option key={meal} value={meal}>{meal}</option>
            ))}
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Cabin</span>
          <select value={cabinFilter} onChange={(event) => setCabinFilter(event.target.value)}>
            <option value="all">All cabins</option>
            {cabinOptions.map((cabin) => (
              <option key={cabin} value={cabin}>{cabin}</option>
            ))}
          </select>
        </label>
        {filtersActive ? (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setMealFilter('all')
              setCabinFilter('all')
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {filtersActive ? (
        <div className={styles.filterSummary}>
          Showing {filteredOrderCount} matching orders. Non-matching seats are dimmed.
        </div>
      ) : null}

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
        <div className={styles.columnLabels} style={{ gridTemplateColumns: seatGridTemplateColumns }}>
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
          <div className={styles.galleyRow}>
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

      {selectedSeatInfo ? (
        <div className={styles.modal} onClick={() => setSelectedSeatState({ layoutId, seat: '' })}>
          <section className={styles.modalCard} aria-live="polite" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Seat {selectedSeatInfo.seat}</h3>
                <p className={styles.modalSubtitle}>
                  {seatCabinMap.get(selectedSeatInfo.seat) || 'Cabin'} {selectedSeatInfo.status === 'empty' ? '- no active order' : '- passenger order'}
                </p>
              </div>
              <span className={`${styles.statusPill} ${styles[selectedSeatInfo.status]}`}>{selectedSeatInfo.status}</span>
            </div>
            {selectedSeatInfo.status === 'empty' ? (
              <p className={styles.emptyMessage}>No order for this seat.</p>
            ) : (
              <div className={styles.modalBody}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Order ID:</span>
                  <span className={styles.detailValue}>#{selectedSeatInfo.orderId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Flight ID:</span>
                  <span className={styles.detailValue}>{selectedSeatInfo.flightId || selectedSeatInfo.sessionId || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Meal:</span>
                  <span className={styles.detailValueWithColor}>
                    {selectedSeatInfo.meal ? (
                      <span className={styles.mealColor} style={{ backgroundColor: getMealColor(selectedSeatInfo.meal) }}></span>
                    ) : null}
                    {selectedSeatInfo.meal || 'N/A'}
                  </span>
                </div>
                {selectedSeatInfo.drink && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Drink:</span>
                    <span className={styles.detailValue}>{selectedSeatInfo.drink}</span>
                  </div>
                )}
                {selectedSeatInfo.dessert && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Dessert:</span>
                    <span className={styles.detailValue}>{selectedSeatInfo.dessert}</span>
                  </div>
                )}
                {selectedSeatInfo.snack && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Snack:</span>
                    <span className={styles.detailValue}>{selectedSeatInfo.snack}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Updated:</span>
                  <span className={styles.detailValue}>{formatTime(selectedSeatInfo.updatedAt || selectedSeatInfo.timestamp)}</span>
                </div>
              </div>
            )}
            <div className={styles.modalActions}>
              {selectedOrder ? (
                <div className={styles.statusControls} aria-label="Update order status">
                  <span className={styles.statusControlLabel}>
                    {selectedOrderUpdating ? (
                      <>
                        <Loader2 size={14} className={styles.spin} />
                        Updating status...
                      </>
                    ) : (
                      'Update status'
                    )}
                  </span>
                  <div className={styles.statusButtons}>
                    {ORDER_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`${styles.statusButton} ${styles[status]} ${selectedOrder.status === status ? styles.statusButtonActive : ''}`}
                        onClick={() => onStatusChange?.(selectedOrder, status)}
                        disabled={selectedOrderUpdating || selectedOrder.status === status}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button type="button" className={styles.close} onClick={() => setSelectedSeatState({ layoutId, seat: '' })}>
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {orderedMealOptions.length > 0 ? (
        <div className={styles.mealLegend} aria-label="Meal color legend">
          {orderedMealOptions.map((meal) => (
            <span key={meal} className={styles.mealLegendItem}>
              <span className={styles.mealColor} style={{ backgroundColor: getMealColor(meal) }}></span>
              {meal}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function buildSeatGridColumns(sectionWidths) {
  const columns = []
  sectionWidths.forEach((width, index) => {
    for (let i = 0; i < width; i += 1) columns.push('minmax(46px, 1fr)')
    if (index < sectionWidths.length - 1) columns.push('minmax(38px, 0.8fr)')
  })
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
