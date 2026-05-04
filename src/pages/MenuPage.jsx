/**
 * Enhanced Passenger Menu Page with FlightHeader and improved session management
 * Displays flight information, seat confirmation, and meal selection
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LogOut, UtensilsCrossed, AlertCircle, Plane } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import FlightHeader from '../components/layout/FlightHeader'
import GrabMenuRow from '../components/passenger/GrabMenuRow'
import StatusTracker from '../components/passenger/StatusTracker'
import { useSession } from '../context/useSession'
import { firebaseConfigured } from '../firebase/config'
import { usePassengerMenu } from '../hooks/usePassengerMenu'
import { useOrderForSession } from '../hooks/useOrderForSession'
import styles from './MenuPage.module.css'

export default function MenuPage() {
  const navigate = useNavigate()
  const {
    sessionId,
    seatNumber,
    clearSession,
    flightNumber,
    route,
    departureTime,
    arrivalTime,
    isActive,
    loading: sessionLoading,
    error: sessionError
  } = useSession()
  const { menuItems, menuLoading, menuError } = usePassengerMenu(sessionId)
  const { liveOrder, orderSubError } = useOrderForSession(sessionId, seatNumber)

  const meals = useMemo(() => {
    const list = menuItems.filter((m) => String(m.category || 'meal').toLowerCase() === 'meal')
    return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [menuItems])

  function handleLeave() {
    clearSession()
    navigate('/', { replace: true })
  }

  function openCustomize(mealId) {
    navigate(`/menu/customize/${mealId}`)
  }

  const orderLocked = Boolean(liveOrder)

  // Show loading state while session is initializing
  if (sessionLoading) {
    return (
      <div className={styles.container}>
        <FlightHeader compact />
        <div className={styles.loadingState}>
          <Loader2 className={styles.spin} size={24} />
          <h2>Loading Flight Information...</h2>
          <p>Preparing your meal ordering experience</p>
        </div>
      </div>
    )
  }

  // Show error state if session is invalid
  if (sessionError || !sessionId) {
    return (
      <div className={styles.container}>
        <FlightHeader compact />
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <h2>Session Error</h2>
          <p>{sessionError || 'No valid session found'}</p>
          <div className={styles.errorActions}>
            <button 
              className={styles.primaryBtn}
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <FlightHeader />
      
      <div className={styles.content}>
        <PageShell
          title="Menu"
          subtitle={flightNumber ? `Flight ${flightNumber}` : 'In-Flight Dining'}
          actions={
            <button 
              type="button" 
              className="ifmod-icon-btn" 
              onClick={handleLeave} 
              aria-label="End session"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          }
        >
          {/* Flight Information Summary */}
          {flightNumber && (
            <div className={styles.flightInfo}>
              <div className={styles.flightHeader}>
                <Plane size={16} className={styles.flightIcon} />
                <h3 className={styles.flightTitle}>Flight Details</h3>
              </div>
              <div className={styles.flightDetails}>
                <div className={styles.flightDetail}>
                  <span className={styles.flightLabel}>Flight:</span>
                  <span className={styles.flightValue}>{flightNumber}</span>
                </div>
                {route && (
                  <div className={styles.flightDetail}>
                    <span className={styles.flightLabel}>Route:</span>
                    <span className={styles.flightValue}>{route}</span>
                  </div>
                )}
                {departureTime && (
                  <div className={styles.flightDetail}>
                    <span className={styles.flightLabel}>Departure:</span>
                    <span className={styles.flightValue}>{formatTime(departureTime)}</span>
                  </div>
                )}
                {arrivalTime && (
                  <div className={styles.flightDetail}>
                    <span className={styles.flightLabel}>Arrival:</span>
                    <span className={styles.flightValue}>{formatTime(arrivalTime)}</span>
                  </div>
                )}
                <div className={styles.flightDetail}>
                  <span className={styles.flightLabel}>Status:</span>
                  <span className={`${styles.flightValue} ${isActive ? styles.active : styles.inactive}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.toolbar}>
            <span className={styles.toolbarIcon} aria-hidden>
              <UtensilsCrossed size={18} strokeWidth={2} />
            </span>
            <p className={styles.hint}>
              Seat <strong>{seatNumber}</strong> · Choose a meal below
            </p>
          </div>

      {!firebaseConfigured ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          Connect Firebase (see .env.example).
        </p>
      ) : null}

      {menuError && firebaseConfigured ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {menuError}
        </p>
      ) : null}

      {orderSubError ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {orderSubError}
        </p>
      ) : null}

          {liveOrder ? <StatusTracker order={liveOrder} /> : null}

      {!orderLocked && !menuLoading && firebaseConfigured ? (
        <ul className={styles.grabList}>
          {meals.map((item) => (
            <li key={item.id} className={styles.grabItem}>
              <GrabMenuRow item={item} onOpen={openCustomize} disabled={orderLocked} />
            </li>
          ))}
        </ul>
      ) : null}

      {menuLoading && firebaseConfigured && !menuError ? (
        <p className={styles.centerMuted}>
          <Loader2 className={styles.spin} size={18} aria-hidden />
          Loading menu
        </p>
      ) : null}

          {!menuLoading && !meals.length && firebaseConfigured && !menuError ? (
            <div className={styles.emptyHint}>
              <p className={styles.emptyTitle}>No meals listed for this flight.</p>
              <p className={styles.emptyBody}>
                Crew can add menu items in the dashboard for flight instance{' '}
                <code className={styles.code}>{sessionId?.slice(0, 8)}…</code>
              </p>
            </div>
          ) : null}
        </PageShell>
      </div>
    </div>
  )
}

/**
 * Format time string for display
 */
function formatTime(timeString) {
  if (!timeString) return ''
  
  try {
    if (typeof timeString === 'string') {
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString
      }
      
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
