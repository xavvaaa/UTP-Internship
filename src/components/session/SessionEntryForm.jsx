/**
 * Passenger entry: access_code + seat → resolve + join-passenger
 */
import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plane } from 'lucide-react'
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
    <div className={styles.container}>
      <FlightHeader compact />

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <Plane size={24} className={styles.headerIcon} />
          <h2 className={styles.formTitle}>Flight access</h2>
          <p className={styles.formSubtitle}>
            Enter the access code and your seat to open the menu for this flight
          </p>
        </div>

        {sessionError ? (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={16} />
            <span>{sessionError}</span>
          </div>
        ) : null}

        {error ? (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={accessId}>
              Access code
            </label>
            <div className={styles.fieldRow}>
              <input
                id={accessId}
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
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={seatId}>
              Seat number
            </label>
            <div className={styles.fieldRow}>
              <input
                id={seatId}
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
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={loading || sessionLoading}
            >
              {loading || sessionLoading ? (
                <>
                  <Loader2 className={styles.spin} size={18} aria-hidden />
                  Connecting…
                </>
              ) : (
                'Continue to menu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
