/**
 * Dynamic Flight Header Component
 * Displays consistent flight information across all pages
 * Shows: flightNumber, route, access code, departureTime, session status
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
    accessCode,
    isActive,
    loading,
    error 
  } = useSession()

  const accessCodePill = accessCode ? (
    <div
      className={styles.accessCode}
      aria-label={`Access code ${accessCode}`}
    >
      <span className={styles.accessLabel}>Code</span>
      <strong>{accessCode}</strong>
    </div>
  ) : null

  const statusPill = (
    <div className={`${styles.statusPill} ${isActive ? styles.active : styles.inactive}`}>
      <span className={styles.accessLabel}>Status</span>
      <strong>{isActive ? 'Active' : 'Inactive'}</strong>
      {isActive ? <CheckCircle size={14} aria-hidden /> : <AlertCircle size={14} aria-hidden />}
    </div>
  )

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
            <span className={styles.flightNumber}>{formatFlightLabel(flightNumber)}</span>
            {route && <span className={styles.route}>{route}</span>}
          </div>
          <div className={styles.compactMeta}>
            {accessCodePill}
            {statusPill}
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
              <h1 className={styles.flightNumber}>{formatFlightLabel(flightNumber)}</h1>
              {route && (
                <div className={styles.route}>
                  <MapPin size={14} />
                  <span>{route}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.headerActions}>
            {accessCodePill}
            {statusPill}
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
        </div>
      </div>
    </header>
  )
}

function formatFlightLabel(flightNumber) {
  const value = String(flightNumber || '').trim()
  if (!value) return 'Unknown Flight'
  return /^flight\b/i.test(value) ? value : `Flight ${value}`
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
