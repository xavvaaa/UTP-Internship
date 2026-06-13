/**
 * Passenger entry: access_code + seat → resolve + join-passenger
 */
import { useId, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plane, Key, ArrowRight, Coffee, QrCode } from 'lucide-react'
import { useSession } from '../../context/useSession'
import { joinPassengerSession, resolveSessionByCode } from '../../services/flightSessionService'
import { isValidSeatFormat } from '../../utils/seatFormat'
import QRScanner from '../qr/QRScanner'
import { BRAND_NAME, pageTitle } from '../../constants/brand'
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
  const [showQRScanner, setShowQRScanner] = useState(false)

  useEffect(() => {
    document.title = pageTitle('Passenger Login')
  }, [])

  const handleQRScanSuccess = async (qrData) => {
    try {
      // Validate the QR data with backend
      const resolved = await resolveSessionByCode(qrData.access_code)
      if (!resolved.ok) {
        setError(resolved.error || 'Invalid QR code.')
        return
      }

      // Auto-fill the access code
      setAccessCode(qrData.access_code)
      setShowQRScanner(false)
      setError('')
      
      // Focus on seat input for better UX
      const seatInput = document.getElementById(seatId)
      if (seatInput) {
        seatInput.focus()
      }
    } catch (err) {
      console.error('QR validation error:', err)
      setError('Failed to validate QR code.')
    }
  }

  const handleQRScanError = (error) => {
    setError(error || 'QR scan failed. Please try again.')
  }

  const openQRScanner = () => {
    setShowQRScanner(true)
    setError('')
  }

  const closeQRScanner = () => {
    setShowQRScanner(false)
  }

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
        navigate('/menu')
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
            <div className={styles.logoText}>{BRAND_NAME}</div>
          </div>
          
          <h1 className={styles.mainHeading}>In-Flight Meal Ordering System</h1>
          <div className={styles.accentLine}></div>
          <p className={styles.description}>
            Join with your seat number, choose a meal, and follow your order from your phone.
          </p>
        </div>
      </div>
      
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <div className={styles.mobileBrand}>
            <div className={styles.mobileBrandIcon}>
              <Coffee size={20} />
            </div>
            <span className={styles.mobileBrandName}>{BRAND_NAME}</span>
          </div>

          <div className={styles.qrBadge}>
            <QrCode size={32} />
          </div>
          
          <h2 className={styles.loginTitle}>Access your in-flight menu</h2>
          <p className={styles.loginSubtitle}>Scan the cabin QR code or enter the crew access code.</p>
          
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
          
          {/* Large QR Scanner Section */}
          <button 
            className={styles.qrScannerSection}
            onClick={openQRScanner}
            disabled={loading || sessionLoading}
          >
            <div className={styles.qrScannerIcon}>
              <QrCode size={40} />
            </div>
            <div className={styles.qrScannerContent}>
              <h3>Scan QR Code</h3>
              <p>Use your camera to scan the in-flight QR code</p>
            </div>
          </button>
          
          {/* OR Divider */}
          <div className={styles.orDivider}>
            <div className={styles.orLine}></div>
            <span className={styles.orText}>OR</span>
            <div className={styles.orLine}></div>
          </div>
          
          {/* Manual Input Section */}
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.label}>
              Access code
              <div className={styles.inputWrapper}>
                <Key className={styles.inputIcon} size={20} />
                <input
                  id={accessId}
                  className={styles.input}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(ev) => setAccessCode(ev.target.value.toUpperCase())}
                  disabled={loading || sessionLoading}
                />
              </div>
              <span className={styles.fieldHint}>Ask cabin crew for the code if the QR is not available.</span>
            </label>
            
            <label className={styles.label}>
              Seat number
              <div className={styles.inputWrapper}>
                <Plane className={styles.inputIcon} size={20} />
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
              <span className={styles.fieldHint}>Use the format on your boarding pass, like 12A.</span>
            </label>
            
            <button className={styles.button} disabled={loading || sessionLoading}>
              {loading || sessionLoading ? (
                <>
                  <Loader2 className={styles.spin} size={16} />
                  Connecting...
                </>
              ) : (
                <>
                  Continue to Menu
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onScanError={handleQRScanError}
          onClose={closeQRScanner}
        />
      )}
    </div>
  )
}
