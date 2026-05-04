/**
 * Cabin crew login page for admin dashboard access.
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
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

  const denied = Boolean(location.state?.denied)
  const from = location.state?.from || '/admin'

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
    <PageShell
      title="Cabin Crew Login"
      subtitle="Authorized crew only"
      actions={
        <span className="ifmod-badge" aria-hidden>
          <ShieldCheck size={18} strokeWidth={2} />
        </span>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {denied ? (
          <p className={styles.alert} role="alert">
            <AlertCircle size={16} aria-hidden />
            You do not have permission to access that admin page.
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
          <input
            className={styles.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className={styles.spin} size={16} />
              Signing in
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </PageShell>
  )
}
