/**
 * Dynamic Flight Header Component
 * Displays consistent flight information across all pages
 * Shows: flightNumber, route, departureTime, session status
 */
import { Plane, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { useSession } from '../../context/useSession'
import styles from './FlightHeader.module.css'

export default function FlightHeader({ compact = false }) {
  const { 
    sessionId, 
    flightNumber, 
    route, 
    departureTime, 
    arrivalTime, 
    isActive,
    loading,
    error 
  } = useSession()

  // Don't render if no session data
  if (!sessionId && !loading) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <header className={`${styles.header} ${styles.loading}`}>
        <div className={styles.placeholder}>
          <Plane size={20} className={styles.spin} />
          <span>Loading flight information...</span>
        </div>
      </header>
    )
  }

  // Error state
  if (error) {
    return (
      <header className={`${styles.header} ${styles.error}`}>
        <div className={styles.errorContent}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      </header>
    )
  }

  // Compact version for smaller spaces
  if (compact) {
    return (
      <header className={`${styles.header} ${styles.compact}`}>
        <div className={styles.compactContent}>
          <div className={styles.flightInfo}>
            <span className={styles.flightNumber}>{flightNumber || 'Unknown Flight'}</span>
            {route && <span className={styles.route}>{route}</span>}
          </div>
          <div className={`${styles.status} ${isActive ? styles.active : styles.inactive}`}>
            {isActive ? (
              <><CheckCircle size={12} /> Active</>
            ) : (
              <><AlertCircle size={12} /> Inactive</>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Full header
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.primaryInfo}>
          <div className={styles.flightSection}>
            <Plane size={20} className={styles.icon} />
            <div>
              <h1 className={styles.flightNumber}>{flightNumber || 'Unknown Flight'}</h1>
              {route && (
                <div className={styles.route}>
                  <MapPin size={14} />
                  <span>{route}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
            {isActive ? (
              <>
                <CheckCircle size={14} />
                <span>Active Session</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                <span>Inactive</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.secondaryInfo}>
          {departureTime && (
            <div className={styles.timeInfo}>
              <Clock size={14} />
              <span>Departs: {formatTime(departureTime)}</span>
            </div>
          )}
          {arrivalTime && (
            <div className={styles.timeInfo}>
              <Clock size={14} />
              <span>Arrives: {formatTime(arrivalTime)}</span>
            </div>
          )}
          <div className={styles.sessionInfo}>
            <span className={styles.sessionId}>Session: {sessionId?.slice(-8) || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Format time string for display
 */
function formatTime(timeString) {
  if (!timeString) return ''
  
  try {
    // Handle various time formats
    if (typeof timeString === 'string') {
      // If it's already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString
      }
      
      // If it's an ISO string, extract time
      const date = new Date(timeString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: false 
        })
      }
    }
    
    return timeString
  } catch {
    return timeString
  }
}
