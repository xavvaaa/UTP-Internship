/**
 * After Firebase login: enter flight access_code to bind dashboard to flight_instance_id.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plane, Shield, User, ArrowRight, ListTodo, Users, BarChart3 } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { useAuth } from '../context/useAuth'
import { useSession } from '../context/useSession'
import { resolveSessionByCode } from '../services/flightSessionService'
import { getDefaultRoute } from '../utils/roleBasedRoutes'
import styles from './AdminLoginPage.module.css'

export default function AdminJoinSessionPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { setSession } = useSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    document.title = 'IFMOD | Cabin Crew Login'
  }, [])

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
        // Use role-based routing for redirects
        const defaultRoute = getDefaultRoute(role)
        if (role === 'crew') {
          navigate('/crew/dashboard')
        } else {
          navigate(defaultRoute)
        }
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
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
              <Plane size={24} />
            </div>
            <div className={styles.logoText}>IFMOD</div>
          </div>
          
          <h1 className={styles.mainHeading}>In-Flight Meal Ordering Dashboard</h1>
          <div className={styles.accentLine}></div>
          <p className={styles.description}>
            Comprehensive system for managing in-flight meal orders, monitoring passenger requests, and overseeing service operations for your assigned flight session.
          </p>
          
          <div className={styles.featureCards}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ListTodo size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Manage Orders</h3>
                <p>Process and track meal orders efficiently</p>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Users size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Monitor Requests</h3>
                <p>Real-time passenger request tracking</p>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <BarChart3 size={20} />
              </div>
              <div className={styles.featureContent}>
                <h3>Service Oversight</h3>
                <p>Analytics and service management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <div className={styles.lockBadge}>
            <User size={32} />
          </div>
          
          <h2 className={styles.loginTitle}>Cabin Crew Login</h2>
          <p className={styles.loginSubtitle}>Enter the access code for this flight</p>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {error ? (
              <p className={styles.alert} role="alert">
                {error}
              </p>
            ) : null}
            
            <label className={styles.label}>
              Access code
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} size={20} />
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
              </div>
            </label>
            
            <button className={styles.button} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spin} size={16} />
                  Joining...
                </>
              ) : (
                <>
                  Continue to dashboard
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
