/**
 * Seat grid mapped from orders with status-based color states.
 */
import styles from './SeatMapView.module.css'

const ROWS = Array.from({ length: 31 }, (_v, i) => i + 1)
const LEFT_COLS = ['A', 'B', 'C']
const RIGHT_COLS = ['D', 'E', 'F']

function SeatButton({ seat, seatOrderMap, selectedSeat, onSelectSeat }) {
  const order = seatOrderMap[seat] || null
  const status = order?.status || 'empty'
  const active = selectedSeat === seat

  return (
    <button
      type="button"
      className={`${styles.seat} ${styles[status] || ''} ${active ? styles.active : ''}`}
      onClick={() => onSelectSeat(seat)}
    >
      <span>{seat}</span>
    </button>
  )
}

function RestroomIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M7 5.2a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2ZM6 7h2l1.2 3.6V22H7.7v-6H6.3v6H4.8V10.6L6 7Zm11 0c1.3 0 2.4 1 2.4 2.4v4h-1.8V22h-1.6v-5.6h-1.8V22h-1.6v-8.6h-1.8v-4c0-1.3 1-2.4 2.4-2.4H17ZM17 5.2a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z" />
    </svg>
  )
}

function GalleyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M7 3h10v2H7V3Zm-1 4h12l-1 12H7L6 7Zm4 2v5h1.6V9H10Zm2.4 0v5H14V9h-1.6Z" />
      <path d="M9 19h6v2H9z" />
      <path d="M18.5 8.5c1.6 1.1 2.5 2.6 2.5 4.5 0 1.9-.9 3.4-2.5 4.5l-.8-1.1c1.2-.9 1.8-2 1.8-3.4 0-1.4-.6-2.6-1.8-3.4l.8-1.1Zm-13 0 .8 1.1C5.1 10.4 4.5 11.6 4.5 13c0 1.4.6 2.6 1.8 3.4l-.8 1.1C3.9 16.4 3 14.9 3 13c0-1.9.9-3.4 2.5-4.5Z" />
    </svg>
  )
}

function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M6 4h12v5a6 6 0 1 1-12 0V4Zm2 2v3a4 4 0 1 0 8 0V6H8Z" />
      <path d="M11 2h2v4h-2zM4 20h16v2H4z" />
    </svg>
  )
}

export default function SeatMapView({ seatOrderMap, selectedSeat, onSelectSeat }) {
  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>Seat map</h2>

      <div className={styles.cabin}>
        <div className={styles.headerRow} aria-hidden="true">
          {LEFT_COLS.map((col) => (
            <span key={col} className={styles.colLabel}>
              {col}
            </span>
          ))}
          <span className={styles.aisleLabel}>Row</span>
          {RIGHT_COLS.map((col) => (
            <span key={col} className={styles.colLabel}>
              {col}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {ROWS.flatMap((row) => [
            ...LEFT_COLS.map((col) => {
              const seat = `${row}${col}`
              return (
                <SeatButton
                  key={seat}
                  seat={seat}
                  seatOrderMap={seatOrderMap}
                  selectedSeat={selectedSeat}
                  onSelectSeat={onSelectSeat}
                />
              )
            }),
            <span key={`row-${row}`} className={styles.rowLabel}>
              {row}
            </span>,
            ...RIGHT_COLS.map((col) => {
              const seat = `${row}${col}`
              return (
                <SeatButton
                  key={seat}
                  seat={seat}
                  seatOrderMap={seatOrderMap}
                  selectedSeat={selectedSeat}
                  onSelectSeat={onSelectSeat}
                />
              )
            }),
          ])}
        </div>

        <div className={styles.rearSection}>
          <div className={styles.rearTop}>
            <div className={styles.utilityBlock}>
              <RestroomIcon />
              <span>Restroom</span>
            </div>
            <div className={styles.utilityBlock}>
              <RestroomIcon />
              <span>Restroom</span>
            </div>
          </div>

          <div className={styles.galleyRow}>
            <div className={styles.galley}>
              <GalleyIcon />
              <span>Galley</span>
            </div>
            <div className={styles.service}>
              <ServiceIcon />
              <span>Service area</span>
            </div>
          </div>

          <div className={styles.backLabel}>Back of the plane</div>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.empty}>Empty</span>
        <span className={styles.pending}>Pending</span>
        <span className={styles.preparing}>Preparing</span>
        <span className={styles.delivered}>Delivered</span>
      </div>
    </section>
  )
}
