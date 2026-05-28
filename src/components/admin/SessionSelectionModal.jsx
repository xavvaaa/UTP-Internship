/**
 * Session Selection Modal - Force admin to select or create a session on login
 */
import { useState, useEffect } from 'react'
import { X, Plus, CheckCircle, AlertTriangle, Plane } from 'lucide-react'
import { useSession } from '../../context/useSession'
import { useToast } from '../../context/useToast'
import { getAuthToken } from '../../utils/authToken'
import { getSessionSummary, createSession } from '../../services/flightSessionService'
import styles from './SessionSelectionModal.module.css'

export default function SessionSelectionModal({ isOpen, onClose }) {
  const { setActiveSessionId, activeSessionId } = useSession()
  const { showSuccess, showError } = useToast()
  
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [formData, setFormData] = useState({
    flight_number: '',
    date: '',
    departure_time: '',
    route: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchSessions()
    }
  }, [isOpen])

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

  function handleSelectSession(sessionId) {
    setActiveSessionId(sessionId)
    showSuccess('Session selected successfully')
    onClose()
  }

  const getTodayDate = () => new Date().toISOString().split('T')[0]

  if (!isOpen) return null

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <Plane size={20} />
            <h2>Select Flight Session</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.instructions}>
          <p>Please select an active session to manage or create a new one.</p>
        </div>

        {!showCreateForm ? (
          <>
            <div className={styles.sessionList}>
              {loading ? (
                <div className={styles.loading}>Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <Plane size={48} />
                  </div>
                  <h3>No Active Sessions</h3>
                  <p>Create a new session to get started.</p>
                  <button
                    type="button"
                    className={styles.createBtn}
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus size={16} />
                    Create New Session
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`${styles.sessionCard} ${activeSessionId === session.id ? styles.selected : ''}`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className={styles.sessionInfo}>
                      <div className={styles.flightNumber}>{session.flight_number}</div>
                      <div className={styles.sessionDetails}>
                        <span className={styles.date}>{session.date}</span>
                        {session.departure_time && (
                          <span className={styles.time}>{session.departure_time}</span>
                        )}
                        {session.route && <span className={styles.route}>{session.route}</span>}
                        {session.access_code && (
                          <span className={styles.code}>Code: {session.access_code}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.sessionStatus}>
                      <CheckCircle size={16} />
                      <span>Active</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {sessions.length > 0 && (
              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.createBtn}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={16} />
                  Create New Session
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.createForm}>
            <div className={styles.formHeader}>
              <h3>Create New Session</h3>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setShowCreateForm(false)}
              >
                <X size={16} />
                Back
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Flight number *</label>
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
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={styles.input}
                    min={getTodayDate()}
                    disabled={creating}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Departure time *</label>
                  <input
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className={styles.input}
                    disabled={creating}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Route</label>
                  <input
                    type="text"
                    placeholder="e.g. KUL-SIN"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className={styles.input}
                    disabled={creating}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={creating}>
                {creating ? 'Creating…' : 'Create Session'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
