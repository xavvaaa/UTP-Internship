/**
 * Passenger menu dashboard with flight context, meal search, and live order status.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Loader2, LogOut, Plane, Search, UtensilsCrossed } from 'lucide-react'
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
    error: sessionError,
  } = useSession()
  const { menuItems, menuLoading, menuError } = usePassengerMenu(sessionId)
  const { liveOrder, orderSubError } = useOrderForSession(sessionId, seatNumber)
  const [searchQuery, setSearchQuery] = useState('')

  const meals = useMemo(() => {
    const list = menuItems.filter((m) => String(m.category || 'meal').toLowerCase() === 'meal')
    return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [menuItems])

  const visibleMeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return meals
    return meals.filter((item) =>
      [item.name, item.description, ...(item.allergens || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [meals, searchQuery])

  function handleLeave() {
    clearSession()
    navigate('/')
  }

  function openCustomize(mealId) {
    navigate(`/menu/customize/${mealId}`)
  }

  const orderLocked = Boolean(liveOrder)

  if (sessionLoading) {
    return (
      <div className={styles.container}>
        <FlightHeader compact />
        <div className={styles.loadingState}>
          <Loader2 className={styles.spin} size={24} />
          <h2>Loading flight information...</h2>
          <p>Preparing your meal ordering experience</p>
        </div>
      </div>
    )
  }

  if (sessionError || !sessionId) {
    return (
      <div className={styles.container}>
        <FlightHeader compact />
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <h2>Session error</h2>
          <p>{sessionError || 'No valid session found'}</p>
          <div className={styles.errorActions}>
            <button className={styles.primaryBtn} onClick={() => navigate('/')}>
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
          title="Choose your meal"
          subtitle={flightNumber ? `Flight ${flightNumber} dining for seat ${seatNumber}` : 'In-flight dining'}
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
          <section className={styles.dashboardHero}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Passenger dashboard</span>
              <h2>Welcome aboard</h2>
              <p>Pick a meal, customize your sides, and track your order as cabin crew prepares it.</p>
            </div>

            <div className={styles.heroCards}>
              <article className={styles.heroCard}>
                <span className={styles.heroLabel}>Seat</span>
                <strong>{seatNumber || 'N/A'}</strong>
              </article>
              <article className={styles.heroCard}>
                <span className={styles.heroLabel}>Meals</span>
                <strong>{meals.length}</strong>
              </article>
              <article className={`${styles.heroCard} ${isActive ? styles.goodCard : styles.warnCard}`}>
                <span className={styles.heroLabel}>Session</span>
                <strong>{isActive ? 'Active' : 'Inactive'}</strong>
              </article>
            </div>
          </section>

          {flightNumber ? (
            <section className={styles.flightInfo}>
              <div className={styles.flightSummary}>
                <Plane size={18} className={styles.flightIcon} />
                <div>
                  <h3 className={styles.flightTitle}>{flightNumber}</h3>
                  {route ? <p className={styles.flightRoute}>{route}</p> : null}
                </div>
              </div>
              <div className={styles.flightDetails}>
                {departureTime ? (
                  <div className={styles.flightDetail}>
                    <Clock size={14} aria-hidden />
                    <span className={styles.flightLabel}>Departure</span>
                    <span className={styles.flightValue}>{formatTime(departureTime)}</span>
                  </div>
                ) : null}
                {arrivalTime ? (
                  <div className={styles.flightDetail}>
                    <Clock size={14} aria-hidden />
                    <span className={styles.flightLabel}>Arrival</span>
                    <span className={styles.flightValue}>{formatTime(arrivalTime)}</span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {!orderLocked ? (
            <section className={styles.menuPanel}>
              <div className={styles.menuPanelHeader}>
                <div className={styles.menuTitle}>
                  <span className={styles.toolbarIcon} aria-hidden>
                    <UtensilsCrossed size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <h3>Available meals</h3>
                    <p>
                      {meals.length
                        ? `${meals.length} meals ready for this flight`
                        : 'Meals will appear here once crew adds them.'}
                    </p>
                  </div>
                </div>
                <label className={styles.searchBox}>
                  <Search size={16} aria-hidden />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search meals"
                  />
                </label>
              </div>
            </section>
          ) : null}

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
              {visibleMeals.map((item) => (
                <li key={item.id} className={styles.grabItem}>
                  <GrabMenuRow item={item} onOpen={openCustomize} disabled={orderLocked} />
                </li>
              ))}
            </ul>
          ) : null}

          {!orderLocked && !menuLoading && meals.length > 0 && visibleMeals.length === 0 && firebaseConfigured ? (
            <div className={styles.emptyHint}>
              <p className={styles.emptyTitle}>No meals match your search.</p>
              <p className={styles.emptyBody}>Try a different meal name, ingredient, or allergen.</p>
              <button type="button" className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                Clear search
              </button>
            </div>
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
                <code className={styles.code}>{sessionId?.slice(0, 8)}...</code>
              </p>
            </div>
          ) : null}
        </PageShell>
      </div>
    </div>
  )
}

function formatTime(timeString) {
  if (!timeString) return ''

  try {
    if (typeof timeString === 'string') {
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString
      }

      const date = new Date(timeString)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        })
      }
    }

    return timeString
  } catch {
    return timeString
  }
}
