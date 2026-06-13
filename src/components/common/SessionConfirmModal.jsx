/**
 * Session Confirmation Modal - Confirms session selection
 */
import { Plane, AlertTriangle } from 'lucide-react'
import styles from './SessionConfirmModal.module.css'

export default function SessionConfirmModal({ 
  session, 
  isOpen, 
  onClose, 
  onConfirm 
}) {
  if (!isOpen || !session) return null

  function handleConfirm() {
    onConfirm(session.id)
    onClose()
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <Plane size={24} />
          </div>
          <h3>Confirm Session Selection</h3>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.sessionInfo}>
            <div className={styles.flightNumber}>{session.flight_number}</div>
            <div className={styles.sessionDetails}>
              <span className={styles.date}>{session.date}</span>
              {session.departure_time && (
                <span className={styles.time}>{session.departure_time}</span>
              )}
              {session.route && <span className={styles.route}>{session.route}</span>}
              {session.aircraft_type && <span className={styles.route}>{session.aircraft_type}</span>}
            </div>
          </div>

          <div className={styles.confirmationMessage}>
            <div className={styles.messageIcon}>
              <AlertTriangle size={20} />
            </div>
            <p>
              Are you sure you want to manage this session? 
              You will be redirected to the dashboard to manage this flight.
            </p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
          >
            Manage Session
          </button>
        </div>
      </div>
    </div>
  )
}
