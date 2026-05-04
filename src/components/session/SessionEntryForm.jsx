/**
 * Passenger entry: access_code + seat → resolve + join-passenger
 */
import { useId, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plane, Key, ArrowRight, Coffee, Utensils, Clock } from 'lucide-react'
import { useSession } from '../../context/useSession'
import { joinPassengerSession, resolveSessionByCode } from '../../services/flightSessionService'
import { isValidSeatFormat } from '../../utils/seatFormat'
import FlightHeader from '../layout/FlightHeader'
import styles from './SessionEntryForm.module.css'

export default function SessionEntryForm() {
  const accessId = useId()
  const seatId = useId()
  const navigate = useNavigate()
  const { setSession, loading: sessionLoading, error: sessionError } = useSession()

  const [accessCode, setAccessCode] = useState('')
  const [seatInput, setSeatInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'IFMOD | Passenger Login'
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const code = accessCode.trim().toUpperCase()
    const seatRaw = seatInput.trim().toUpperCase()

    if (!code) {
      setError('Enter the access code from the crew.')
      return
    }
    if (!seatRaw) {
      setError('Enter your seat number.')
      return
    }
    if (!isValidSeatFormat(seatRaw)) {
      setError('Seat must be row + letter (e.g. 12A).')
      return
    }

    setLoading(true)
    try {
      const resolved = await resolveSessionByCode(code)
      if (!resolved.ok) {
        setError(resolved.error || 'Could not find this flight.')
        return
      }

      const fid = resolved.flight_instance_id
      const joined = await joinPassengerSession(fid, seatRaw)
      if (!joined.ok) {
        setError(joined.error || 'Could not join session.')
        return
      }

      const ok = await setSession({
        sessionId: fid,
        seatNumber: seatRaw,
        sessionInfo: joined.session,
        role: 'passenger',
      })
      if (ok) {
        navigate('/menu', { replace: true })
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logoSquare}>
              <Coffee size={24} />
            </div>
            <div className={styles.logoText}>IFMOD</div>
          </div>
          
          <h1 className={styles.mainHeading}>In-Flight Meal Ordering System</h1>
          <div className={styles.accentLine}></div>
          <p className={styles.description}>
            Welcome to your personalized in-flight dining experience. Browse our menu, customize your meals, and enjoy premium service during your journey.
          </p>
          
          <div className={styles.featureCards}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Utensils size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Browse Menu</h3>
                <p>Explore our delicious meal options</p>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Coffee size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Customize Orders</h3>
                <p>Personalize your meal preferences</p>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Clock size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Track Delivery</h3>
                <p>Monitor your meal status in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <div className={styles.lockBadge}>
            <Plane size={32} />
          </div>
          
          <h2 className={styles.loginTitle}>Passenger Login</h2>
          <p className={styles.loginSubtitle}>Enter your flight access code and seat number</p>
          
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            {sessionError ? (
              <p className={styles.alert} role="alert">
                <AlertCircle size={16} aria-hidden />
                {sessionError}
              </p>
            ) : null}

            {error ? (
              <p className={styles.alert} role="alert">
                <AlertCircle size={16} aria-hidden />
                {error}
              </p>
            ) : null}
            
            <label className={styles.label}>
              Access code
              <div className={styles.inputWrapper}>
                <Key className={styles.inputIcon} size={20} />
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="From crew"
                  value={accessCode}
                  onChange={(ev) => setAccessCode(ev.target.value.toUpperCase())}
                  disabled={loading || sessionLoading}
                />
              </div>
            </label>
            
            <label className={styles.label}>
              Seat number
              <div className={styles.inputWrapper}>
                <Plane className={styles.inputIcon} size={20} />
                <input
                  className={styles.input}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="e.g. 12A"
                  maxLength={4}
                  value={seatInput}
                  onChange={(ev) => setSeatInput(ev.target.value.toUpperCase())}
                  disabled={loading || sessionLoading}
                />
              </div>
            </label>
            
            <button className={styles.button} disabled={loading || sessionLoading}>
              {loading || sessionLoading ? (
                <>
                  <Loader2 className={styles.spin} size={16} />
                  Connecting...
                </>
              ) : (
                <>
                  Continue to menu
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
