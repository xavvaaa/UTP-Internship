/**
 * Admin (Purser) login page for admin dashboard access.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldCheck, AlertCircle, Eye, EyeOff, Mail, Lock, ArrowRight, ListTodo, Users, BarChart3, Headphones } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { useAuth } from '../context/useAuth'
import { useSession } from '../context/useSession'
import styles from './AdminLoginPage.module.css'

export default function AdminLoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const denied = Boolean(location.state?.denied)
  const from = location.state?.from || '/admin/select-session'

  useEffect(() => {
    document.title = 'IFMOD | Admin Login'
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not sign in.')
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
              <Lock size={24} />
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
            <Lock size={32} />
          </div>
          
          <h2 className={styles.loginTitle}>Admin (Purser) Login</h2>
          <p className={styles.loginSubtitle}>Sign in to your account to continue</p>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {denied ? (
              <p className={styles.alert} role="alert">
                <AlertCircle size={16} aria-hidden />
                You do not have permission to access the admin dashboard.
              </p>
            ) : null}
            {error ? (
              <p className={styles.alert} role="alert">
                <AlertCircle size={16} aria-hidden />
                {error}
              </p>
            ) : null}
            
            <label className={styles.label}>
              Email
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={20} />
                <input
                  className={styles.input}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </label>
            
            <label className={styles.label}>
              Password
              <div className={styles.passwordWrapper}>
                <Lock className={styles.inputIcon} size={20} />
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            
            <div className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                id="remember"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className={styles.checkboxLabel}>
                Remember me
              </label>
            </div>
            
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spin} size={16} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
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
