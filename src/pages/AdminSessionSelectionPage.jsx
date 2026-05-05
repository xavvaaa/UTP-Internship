/**
 * Admin Session Selection Page - Select a session to manage
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CheckCircle, AlertTriangle, Plane, ArrowLeft, Loader2, ListTodo, Users, BarChart3 } from 'lucide-react'
import { useSession } from '../context/useSession'
import { useToast } from '../context/useToast'
import { getAuthToken } from '../utils/authToken'
import { getSessionSummary, createSession } from '../services/flightSessionService'
import SessionConfirmModal from '../components/common/SessionConfirmModal'
import { getDefaultRoute } from '../utils/roleBasedRoutes'
import styles from './AdminSessionSelectionPage.module.css'

export default function AdminSessionSelectionPage() {
  const { setActiveSessionId, activeSessionId } = useSession()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  
  const [formData, setFormData] = useState({
    flight_number: '',
    date: '',
    departure_time: '',
    route: '',
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const result = await getSessionSummary(token, { scope: 'global' })
      if (result.ok) {
        setSessions(result.active || [])
      } else {
        showError(result.error || 'Failed to fetch sessions')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSession(e) {
    e.preventDefault()
    if (!formData.flight_number?.trim()) {
      showError('Flight number is required')
      return
    }
    if (!formData.date) {
      showError('Date is required')
      return
    }
    if (!formData.departure_time?.trim()) {
      showError('Departure time is required')
      return
    }

    try {
      setCreating(true)
      const token = await getAuthToken()
      const result = await createSession(formData, token)
      if (result.ok) {
        showSuccess('Session created successfully')
        await handleSelectSession(result.session.id)
        setFormData({
          flight_number: '',
          date: '',
          departure_time: '',
          route: '',
        })
        setShowCreateForm(false)
      } else {
        showError(result.error || 'Failed to create session')
      }
    } catch (err) {
      showError('Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  function handleSelectSession(session) {
    setSelectedSession(session)
    setShowConfirmModal(true)
  }

  async function confirmSelectSession(sessionId) {
    setActiveSessionId(sessionId)
    showSuccess('Session selected successfully')
    // Navigate directly to admin dashboard
    navigate('/admin')
  }

  const getTodayDate = () => new Date().toISOString().split('T')[0]

  useEffect(() => {
    document.title = 'IFMOD | Select Session'
  }, [])

  if (showCreateForm) {
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
            
            <h1 className={styles.mainHeading}>Create New Session</h1>
            <div className={styles.accentLine}></div>
            <p className={styles.description}>
              Set up a new flight session for in-flight meal ordering and service management.
            </p>
            
            <div className={styles.featureCards}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <ListTodo size={20} />
                </div>
                <div className={styles.featureContent}>
                  <h3>Session Management</h3>
                  <p>Create and manage flight sessions efficiently</p>
                </div>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Users size={20} />
                </div>
                <div className={styles.featureContent}>
                  <h3>Crew Assignment</h3>
                  <p>Assign cabin crew to specific flights</p>
                </div>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <BarChart3 size={20} />
                </div>
                <div className={styles.featureContent}>
                  <h3>Service Analytics</h3>
                  <p>Track performance and service metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.loginCard} style={{ height: 'auto', maxHeight: 'none' }}>
            <div className={styles.lockBadge}>
              <Plus size={32} />
            </div>
            
            <h2 className={styles.loginTitle}>Create New Session</h2>
            <p className={styles.loginSubtitle}>Enter flight details to create a new session</p>
            
            <form onSubmit={handleCreateSession} className={styles.form}>
              <div className={styles.formRow}>
                <label className={styles.label}>
                  Flight number
                  <input
                    type="text"
                    placeholder="e.g. MH123"
                    value={formData.flight_number}
                    onChange={(e) =>
                      setFormData({ ...formData, flight_number: e.target.value.toUpperCase() })
                    }
                    className={styles.input}
                    disabled={creating}
                    required
                  />
                </label>
                
                <label className={styles.label}>
                  Date
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={styles.input}
                    min={getTodayDate()}
                    disabled={creating}
                    required
                  />
                </label>
              </div>
              
              <div className={styles.formRow}>
                <label className={styles.label}>
                  Departure time
                  <input
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className={styles.input}
                    disabled={creating}
                    required
                  />
                </label>
                
                <label className={styles.label}>
                  Route
                  <input
                    type="text"
                    placeholder="e.g. KUL-SIN"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className={styles.input}
                    disabled={creating}
                  />
                </label>
              </div>
              
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                  style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button type="submit" className={styles.button} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className={styles.spin} size={16} />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Session
                      <Plus size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
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
          
          <h1 className={styles.mainHeading}>Select Session</h1>
          <div className={styles.accentLine}></div>
          <p className={styles.description}>
            Choose a session to manage. Select an active session or create a new one to begin managing in-flight operations.
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
            <Plane size={32} />
          </div>
          
          <h2 className={styles.loginTitle}>Select Session</h2>
          <p className={styles.loginSubtitle}>Choose a session to manage</p>
          
          <div className={styles.form}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Loader2 className={styles.spin} size={24} style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '1rem' }}>Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Plane size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No Active Sessions</h3>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Create a new session to get started.</p>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={16} />
                  Create New Session
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#374151', fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Active Sessions
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Click a session to select it for management
                  </p>
                </div>
                
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={styles.sessionCard}
                    onClick={() => handleSelectSession(session)}
                    style={{
                      backgroundColor: activeSessionId === session.id ? '#dbeafe' : '#f9fafb',
                      borderColor: activeSessionId === session.id ? '#3b82f6' : '#e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '0.5rem',
                      border: '1px solid',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSessionId !== session.id) {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSessionId !== session.id) {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                        {session.flight_number}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        {session.date && (
                          <span style={{ padding: '0.1875rem 0.625rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontWeight: '500' }}>
                            {session.date}
                          </span>
                        )}
                        {session.departure_time && (
                          <span style={{ padding: '0.1875rem 0.625rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontWeight: '500' }}>
                            {session.departure_time}
                          </span>
                        )}
                        {session.route && (
                          <span style={{ padding: '0.1875rem 0.625rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontWeight: '500' }}>
                            {session.route}
                          </span>
                        )}
                        {session.access_code && (
                          <span style={{ padding: '0.1875rem 0.625rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontWeight: '500' }}>
                            Code: {session.access_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} style={{ color: '#10b981' }} />
                      <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '500' }}>Active</span>
                      {activeSessionId === session.id && (
                        <div style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '0.1875rem 0.625rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setShowCreateForm(true)}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  <Plus size={16} />
                  Create New Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Confirmation Modal */}
      <SessionConfirmModal
        session={selectedSession}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSelectSession}
      />
    </div>
  )
}
