/**
 * After Firebase login: enter flight access_code to bind dashboard to flight_instance_id.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plane, Shield } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { useAuth } from '../context/useAuth'
import { useSession } from '../context/useSession'
import { resolveSessionByCode, createSession } from '../services/flightSessionService'
import { getAuthToken } from '../utils/authToken'
import styles from './AdminLoginPage.module.css'

export default function AdminJoinSessionPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { setSession } = useSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmergencyCreate, setShowEmergencyCreate] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const raw = code.trim().toUpperCase()
    if (!raw) {
      setError('Enter the access code.')
      return
    }

    setLoading(true)
    try {
      const result = await resolveSessionByCode(raw)
      if (!result.ok) {
        setError(result.error || 'Could not resolve session.')
        return
      }

      const sessionRole = role === 'admin' ? 'admin' : 'crew'
      const ok = await setSession({
        sessionId: result.flight_instance_id,
        sessionInfo: result.session,
        role: sessionRole,
      })
      if (ok) {
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmergencyCreate(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const token = await getAuthToken()
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      const currentDate = now.toISOString().split('T')[0]
      
      const sessionData = {
        flight_number: 'MH123',
        date: currentDate,
        departure_time: currentTime,
        route: 'KUL-LHR'
      }
      
      const result = await createSession(sessionData, token)
      if (result.ok) {
        const newCode = result.session.access_code
        setCode(newCode)
        setShowEmergencyCreate(false)
        setError('')
        
        // Auto-join the newly created session
        setTimeout(() => {
          handleSubmit(e)
        }, 500)
      } else {
        setError(result.error || 'Failed to create emergency session')
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="Join flight session"
      subtitle="Enter the access code for this flight"
      actions={
        <span className="ifmod-badge" aria-hidden>
          <Shield size={18} strokeWidth={2} />
        </span>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {error ? (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        ) : null}

        <label className={styles.label}>
          Access code
          <input
            className={styles.input}
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            onChange={(ev) => setCode(ev.target.value.toUpperCase())}
            placeholder="e.g. AB12CD34"
            disabled={loading}
          />
        </label>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className={styles.spin} size={18} aria-hidden />
              Joining…
            </>
          ) : (
            <>
              <Plane size={18} aria-hidden />
              Continue to dashboard
            </>
          )}
        </button>
      </form>

      {/* Emergency Access Section */}
      {role === 'admin' && !showEmergencyCreate && (
        <div className={styles.emergencySection}>
          <p className={styles.emergencyText}>
            Can't find your access code? 
            <button 
              type="button" 
              className={styles.emergencyButton}
              onClick={() => setShowEmergencyCreate(true)}
              disabled={loading}
            >
              Create Emergency Session
            </button>
          </p>
        </div>
      )}

      {/* Emergency Create Form */}
      {showEmergencyCreate && (
        <div className={styles.emergencyForm}>
          <h3>Create Emergency Session</h3>
          <p>This will create a new flight session and automatically join you to it.</p>
          
          <button 
            type="button" 
            className={`${styles.button} ${styles.emergencyCreateButton}`}
            onClick={handleEmergencyCreate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={styles.spin} size={18} aria-hidden />
                Creating...
              </>
            ) : (
              <>
                <Plane size={18} aria-hidden />
                Create & Join Session
              </>
            )}
          </button>
          
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={() => setShowEmergencyCreate(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
    </PageShell>
  )
}
