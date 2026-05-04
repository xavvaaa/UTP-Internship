/**
 * Sessions: create, list (summary), end, delete
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, CheckCircle, X, AlertTriangle, Trash2, Edit, Play, Square, CheckSquare2, ChevronUp, ChevronDown, Users } from 'lucide-react'
import { useToast } from '../../context/useToast'
import { useSession } from '../../context/useSession'
import { getAuthToken } from '../../utils/authToken'
import {
  getSessionSummary,
  createSession,
  endSession,
  deleteSession,
  updateSession,
} from '../../services/flightSessionService'
import styles from './SessionsTab.module.css'
import ConfirmDialog from '../common/ConfirmDialog'
import CrewAssignmentModal from './CrewAssignmentModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SessionsTab() {
  const { showSuccess, showError } = useToast()
  const { activeSessionId, setActiveSessionId } = useSession()

  const [activeList, setActiveList] = useState([])
  const [endedList, setEndedList] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState(new Set())
  const [showMultiSelect, setShowMultiSelect] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [showDetails, setShowDetails] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all') // all, active, ended, expired
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [isStatusGuideExpanded, setIsStatusGuideExpanded] = useState(true)
  const [showCrewAssignment, setShowCrewAssignment] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    title: 'Confirm Action',
    type: 'warning',
    confirmText: 'OK'
  })

  const [formData, setFormData] = useState({
    flight_number: '',
    date: '',
    departure_time: '',
    route: '',
  })

  const [editFormData, setEditFormData] = useState({
    flight_number: '',
    date: '',
    departure_time: '',
    route: '',
  })

  const fetchAllSessions = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      // Get all sessions including deleted ones
      const result = await fetch(`${API_URL}/session`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await result.json()
      if (data.success) {
        const allSessions = [...(data.sessions || []), ...(data.deleted_sessions || [])]
        setActiveList(allSessions.filter(s => s.status === 'active'))
        setEndedList(allSessions.filter(s => s.status === 'ended' || s.status === 'expired' || s.status === 'deleted'))
      } else {
        showError(data.error || 'Failed to fetch sessions')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const result = await getSessionSummary(token, { scope: 'global' })
      if (result.ok) {
        setActiveList(result.active ?? [])
        setEndedList(result.endedRecent ?? [])
      } else {
        showError(result.error || 'Failed to fetch sessions')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

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
        showSuccess('Session created')
        setFormData({
          flight_number: '',
          date: '',
          departure_time: '',
          route: '',
        })
        await fetchSummary()
      } else {
        showError(result.error || 'Failed to create session')
      }
    } catch (err) {
      showError('Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  async function handleEnd(sessionId) {
    showConfirm('End this flight session?', async () => {
      try {
        const token = await getAuthToken()
        const result = await endSession(sessionId, token)
        if (result.ok) {
          showSuccess('Session ended')
          await fetchSummary()
        } else {
          showError(result.error || 'Failed to end session')
        }
      } catch {
        showError('Failed to end session')
      }
    }, 'End Session', 'info', 'Yes, end session')
  }

  async function handleDelete(sessionId) {
    showConfirm('Delete this session? This action cannot be undone.', async () => {
      try {
        const token = await getAuthToken()
        const result = await deleteSession(sessionId, token)
        if (result.ok) {
          showSuccess('Session deleted')
          await fetchSummary()
        } else {
          showError(result.error || 'Failed to delete session')
        }
      } catch (err) {
        console.error(err)
        showError('Failed to delete session')
      }
    }, 'Delete Session', 'danger')
  }

  async function handleActivate(sessionId) {
    try {
      const token = await getAuthToken()
      const result = await updateSession(sessionId, { status: 'active' }, token)
      if (result.ok) {
        showSuccess('Session activated')
        await fetchSummary()
      } else {
        showError(result.error || 'Failed to activate session')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to activate session')
    }
  }

  async function handleEdit(session) {
    setEditingSession(session)
    setEditFormData({
      flight_number: session.flight_number || '',
      date: session.date || '',
      departure_time: session.departure_time || '',
      route: session.route || '',
    })
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingSession) return
    
    try {
      const token = await getAuthToken()
      const result = await updateSession(editingSession.id, editFormData, token)
      if (result.ok) {
        showSuccess('Session updated')
        setEditingSession(null)
        await fetchSummary()
      } else {
        showError(result.error || 'Failed to update session')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to update session')
    }
  }

  function handleCrewAssignment(session) {
    setShowCrewAssignment(session)
  }

  function handleCrewAssignmentComplete(updatedSession) {
    // Update the session in the lists
    setActiveList(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s))
    setEndedList(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s))
    setShowCrewAssignment(null)
  }

  function handleSwitchSession(sessionId) {
    setActiveSessionId(sessionId)
    showSuccess('Switched to selected session')
  }

  function getCurrentSessionInfo() {
    if (!activeSessionId) return null
    const allSessions = [...activeList, ...endedList]
    return allSessions.find(s => s.id === activeSessionId)
  }

  async function handleBulkDelete() {
    if (selectedSessions.size === 0) return
    showConfirm(`Delete ${selectedSessions.size} session(s)? This action cannot be undone.`, async () => {
      try {
        const token = await getAuthToken()
        const promises = Array.from(selectedSessions).map(id => deleteSession(id, token))
        const results = await Promise.all(promises)
        
        const failed = results.filter(r => !r.ok).length
        if (failed === 0) {
          showSuccess(`${selectedSessions.size} session(s) deleted`)
        } else {
          showError(`Deleted ${selectedSessions.size - failed} session(s), ${failed} failed`)
        }
        
        setSelectedSessions(new Set())
        setShowMultiSelect(false)
        await fetchSummary()
      } catch (err) {
        console.error(err)
        showError('Failed to delete sessions')
      }
    }, 'Delete Multiple Sessions', 'danger')
  }

  function handleSessionClick(session) {
    setShowDetails(session)
  }

  function toggleSessionSelection(sessionId) {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  async function handleBulkDelete() {
    if (selectedSessions.size === 0) return
    try {
      const token = await getAuthToken()
      const promises = Array.from(selectedSessions).map(id => deleteSession(id, token))
      await Promise.all(promises)
      setSelectedSessions(new Set())
      setShowMultiSelect(false)
      showSuccess(`${selectedSessions.size} session(s) deleted successfully.`)
      fetchAllSessions()
    } catch (err) {
      console.error(err)
      showError('Failed to delete sessions')
    }
  }

  const getTodayDate = () => new Date().toISOString().split('T')[0]

  // Custom confirmation dialog helper
  const showConfirm = (message, onConfirm, title = 'Confirm Action', type = 'warning', confirmText = 'OK') => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      title,
      type,
      confirmText
    })
  }

  // Filter sessions based on selected status (exclude deleted from normal display)
  const displaySessions = [...activeList, ...endedList].filter(session => {
    if (statusFilter === 'all') return session.status !== 'deleted'
    if (statusFilter === 'active') return session.status === 'active'
    if (statusFilter === 'ended') return session.status === 'ended'
    if (statusFilter === 'expired') return session.status === 'expired'
    return session.status !== 'deleted'
  })

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>
            <Plus size={20} />
            Create Flight Session
          </h3>
        </div>
        <div className={styles.formInstructions}>
          <div className={styles.instructionHeader}>
            <h4>Session Setup Guide</h4>
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setIsFormExpanded(!isFormExpanded)}
            >
              {isFormExpanded ? (
                <>
                  <ChevronUp size={16} />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Expand
                </>
              )}
            </button>
          </div>
          {isFormExpanded && (
            <div className={styles.instructionContent}>
              <div className={styles.instructionGrid}>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="setup"></div>
                  <div>
                    <strong>Create Session</strong>
                    <p>Each session represents one flight with its own unique access code for passengers to join.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="details"></div>
                  <div>
                    <strong>Set Flight Details</strong>
                    <p>Enter flight number, date, time, and route. This helps passengers identify their flight.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="manage"></div>
                  <div>
                    <strong>Manage Status</strong>
                    <p>Sessions can be active (accepting orders), ended (completed), or expired (needs reactivation).</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            {creating ? 'Creating…' : 'Create session'}
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>Sessions</h3>
          <div className={styles.headerControls}>
            <div className={styles.filterControls}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Sessions</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className={styles.multiSelectControls}>
              <button
                type="button"
                className={styles.multiSelectBtn}
                onClick={() => setShowMultiSelect(!showMultiSelect)}
              >
                <CheckSquare2 size={16} />
                {showMultiSelect ? 'Cancel Selection' : 'Multi-Select'}
              </button>
              {showMultiSelect && selectedSessions.size > 0 && (
                <div className={styles.bulkActions}>
                  <span>{selectedSessions.size} selected</span>
                  <button
                    type="button"
                    className={styles.bulkDeleteBtn}
                    onClick={handleBulkDelete}
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Session Display */}
        {getCurrentSessionInfo() && (
          <div className={styles.currentSessionCard}>
            <div className={styles.currentSessionHeader}>
              <h4>Currently Managing</h4>
              <div className={styles.currentSessionBadge}>
                Active Session
              </div>
            </div>
            <div className={styles.currentSessionInfo}>
              <div className={styles.currentSessionFlight}>
                {getCurrentSessionInfo().flight_number}
              </div>
              <div className={styles.currentSessionDetails}>
                <span>{getCurrentSessionInfo().date}</span>
                {getCurrentSessionInfo().departure_time && (
                  <span>{getCurrentSessionInfo().departure_time}</span>
                )}
                {getCurrentSessionInfo().route && (
                  <span>{getCurrentSessionInfo().route}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.instructionCard}>
          <div className={styles.instructionHeader}>
            <h4 className={styles.instructionTitle}>Session Status Guide</h4>
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setIsStatusGuideExpanded(!isStatusGuideExpanded)}
            >
              {isStatusGuideExpanded ? (
                <>
                  <ChevronUp size={16} />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Expand
                </>
              )}
            </button>
          </div>
          {isStatusGuideExpanded && (
            <div className={styles.instructionContent}>
              <div className={styles.instructionGrid}>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="active"></div>
                  <div>
                    <strong>Active</strong>
                    <p>Currently running flight session. Can receive orders and manage menu.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="ended"></div>
                  <div>
                    <strong>Ended</strong>
                    <p>Completed flight session. Can be reactivated or deleted.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="expired"></div>
                  <div>
                    <strong>Expired</strong>
                    <p>Session past its expiration date. Can be reactivated or deleted.</p>
                  </div>
                </div>
              </div>
              <div className={styles.multiSelectInfo}>
                <strong>Multi-Select Mode:</strong>
                <p>Enable to select multiple sessions for bulk actions like deleting multiple sessions at once.</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.message}>Loading…</div>
        ) : displaySessions.length === 0 ? (
          <div className={styles.message}>No sessions yet.</div>
        ) : (
          <div className={styles.sessionsList}>
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className={`${styles.sessionCard} ${styles[session.status === 'active' ? 'active' : 'closed']} ${showDetails?.id === session.id ? styles.selected : ''} ${showMultiSelect ? styles.multiSelectMode : ''} ${activeSessionId === session.id ? styles.activeSession : ''}`}
                onClick={() => !showMultiSelect && handleSessionClick(session)}
                style={{ cursor: showMultiSelect ? 'default' : 'pointer' }}
              >
                <div className={styles.sessionHeader}>
                  {showMultiSelect && (
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className={styles.sessionInfo}>
                    <div className={styles.flightNumber}>{session.flight_number}</div>
                    <div className={styles.sessionDetails}>
                      <span className={styles.date}>{session.date}</span>
                      {session.departure_time && (
                        <span className={styles.time}>{session.departure_time}</span>
                      )}
                      {session.route && <span className={styles.route}>{session.route}</span>}
                      {session.access_code && (
                        <span className={styles.route}>Code: {session.access_code}</span>
                      )}
                      {session.expires_at && (
                        <span className={styles.expiration}>
                          Expires: {new Date(session.expires_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.statusBadge}>
                    {session.status === 'active' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    <span>{session.status}</span>
                  </div>
                </div>

                <div className={styles.sessionActions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(session)
                    }}
                    title="Edit Session"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCrewAssignment(session)
                    }}
                    title="Assign Crew"
                  >
                    <Users size={14} />
                  </button>
                  {activeSessionId !== session.id && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.switchBtn}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSwitchSession(session.id)
                      }}
                      title="Switch to this Session"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {session.status === 'active' ? (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnd(session.id)
                      }}
                      title="End Session"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : session.status === 'deleted' ? (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivate(session.id)
                      }}
                      title="Restore Session"
                    >
                      <Play size={14} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivate(session.id)
                        }}
                        title="Activate Session"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(session.id)
                        }}
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Session Details Modal */}
      {showDetails && (
        <div className={styles.modal} onClick={() => setShowDetails(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Session Details</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowDetails(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGroup}>
                <label>Flight Number:</label>
                <span>{showDetails.flight_number}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Date:</label>
                <span>{showDetails.date}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Departure Time:</label>
                <span>{showDetails.departure_time}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Route:</label>
                <span>{showDetails.route}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Access Code:</label>
                <span>{showDetails.access_code}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Status:</label>
                <span>{showDetails.status}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Session ID:</label>
                <span>{showDetails.id}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Created:</label>
                <span>{showDetails.created_at ? new Date(showDetails.created_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.detailGroup}>
                <label>Updated:</label>
                <span>{showDetails.updated_at ? new Date(showDetails.updated_at).toLocaleString() : 'N/A'}</span>
              </div>
              {showDetails.expires_at && (
                <div className={styles.detailGroup}>
                  <label>Expires:</label>
                  <span>{new Date(showDetails.expires_at).toLocaleString()}</span>
                </div>
              )}
              {showDetails.ended_at && (
                <div className={styles.detailGroup}>
                  <label>Ended:</label>
                  <span>{new Date(showDetails.ended_at).toLocaleString()}</span>
                </div>
              )}
              {showDetails.deleted_at && (
                <div className={styles.detailGroup}>
                  <label>Deleted:</label>
                  <span>{new Date(showDetails.deleted_at).toLocaleString()}</span>
                </div>
              )}
              <div className={styles.detailGroup}>
                <label>Occupied Seats:</label>
                <span>{showDetails.occupied_seats?.join(', ') || 'None'}</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => {
                  handleEdit(showDetails)
                  setShowDetails(null)
                }}
              >
                <Edit size={16} />
                Edit Session
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className={styles.modal} onClick={() => setEditingSession(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Session</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setEditingSession(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form id="edit-session-form" onSubmit={handleEditSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Flight Number</label>
                <input
                  type="text"
                  value={editFormData.flight_number}
                  onChange={(e) => setEditFormData({...editFormData, flight_number: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Departure Time</label>
                <input
                  type="time"
                  value={editFormData.departure_time}
                  onChange={(e) => setEditFormData({...editFormData, departure_time: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Route</label>
                <input
                  type="text"
                  value={editFormData.route}
                  onChange={(e) => setEditFormData({...editFormData, route: e.target.value})}
                  placeholder="e.g., KUL-LHR"
                />
              </div>
            </form>
            <div className={styles.modalFooter}>
              <button type="submit" form="edit-session-form" className={styles.saveBtn}>
                Save Changes
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setEditingSession(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crew Assignment Modal */}
      <CrewAssignmentModal
        session={showCrewAssignment}
        isOpen={!!showCrewAssignment}
        onClose={() => setShowCrewAssignment(null)}
        onAssignmentComplete={handleCrewAssignmentComplete}
      />

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        title={confirmDialog.title}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        onConfirm={() => {
          if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm()
          }
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }}
        onCancel={() => {
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }}
      />
    </div>
  )
}
