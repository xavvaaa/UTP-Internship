/**
 * Sessions: create, list (summary), end, delete
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, CheckCircle, X, AlertTriangle, Trash2, Edit, Play, Square, CheckSquare2, ChevronUp, ChevronDown, Users, MoreVertical, Copy } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormExpanded, setIsFormExpanded] = useState(false)
  const [isStatusGuideExpanded, setIsStatusGuideExpanded] = useState(false)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [showCrewAssignment, setShowCrewAssignment] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
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

  useEffect(() => {
    if (!openMenuId) return
    const onDown = () => setOpenMenuId(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [openMenuId])

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
        setIsCreatePanelOpen(false)
        await fetchSummary()
      } else {
        showError(result.error || 'Failed to create session')
      }
    } catch {
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

  async function handleCopyAccessCode() {
    const current = getCurrentSessionInfo()
    const code = current?.access_code ? String(current.access_code) : ''
    if (!code) {
      showError('No access code available for this session.')
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      showSuccess('Access code copied')
    } catch {
      showError('Failed to copy access code')
    }
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
  const displaySessions = [...activeList, ...endedList]
    .filter((session) => {
      if (statusFilter === 'all') return session.status !== 'deleted'
      if (statusFilter === 'active') return session.status === 'active'
      if (statusFilter === 'ended') return session.status === 'ended'
      if (statusFilter === 'expired') return session.status === 'expired'
      return session.status !== 'deleted'
    })
    .filter((session) => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      const hay = [
        session.flight_number,
        session.route,
        session.date,
        session.departure_time,
        session.access_code,
        session.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })

  const { activeSessions, pastSessions } = useMemo(() => {
    const active = []
    const past = []
    for (const s of displaySessions) {
      if (s.status === 'active') active.push(s)
      else past.push(s)
    }
    return { activeSessions: active, pastSessions: past }
  }, [displaySessions])

  const sessionStats = [
    { label: 'Active', value: activeSessions.length },
    { label: 'Past', value: pastSessions.length },
    { label: 'Showing', value: displaySessions.length },
  ]

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'ended', label: 'Ended' },
    { value: 'expired', label: 'Expired' },
  ]

  const currentSession = getCurrentSessionInfo()

  function formatFlightDate(value) {
    if (!value) return 'Not set'
    const parts = String(value).split('-')
    if (parts.length !== 3) return value
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatSessionDateTime(value) {
    if (!value) return ''
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function renderSessionCard(session) {
    const expiryPrefix = session.status === 'expired' ? 'Expired' : 'Expires'
    const isSelected = selectedSessions.has(session.id)

    return (
      <div
        key={session.id}
        className={`${styles.sessionCard} ${styles[session.status] ?? ''} ${showDetails?.id === session.id ? styles.selected : ''} ${showMultiSelect ? styles.multiSelectMode : ''} ${activeSessionId === session.id ? styles.activeSession : ''}`}
        onClick={() => !showMultiSelect && handleSessionClick(session)}
        style={{ cursor: showMultiSelect ? 'default' : 'pointer' }}
      >
        <div className={styles.sessionHeader}>
          {showMultiSelect && (
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSessionSelection(session.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${session.flight_number}`}
              />
            </div>
          )}
          <div className={styles.sessionInfo}>
            <div className={styles.sessionIdentity}>
              <div className={styles.flightNumber}>{session.flight_number}</div>
              <div className={styles.sessionRoute}>{session.route || 'Route not set'}</div>
            </div>
            <div className={styles.sessionDetails}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{formatFlightDate(session.date)}</span>
              </span>
              {session.departure_time && (
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Time</span>
                  <span className={styles.metaValue}>{session.departure_time}</span>
                </span>
              )}
              {session.access_code && (
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Code</span>
                  <span className={styles.metaValue}>{session.access_code}</span>
                </span>
              )}
              {session.expires_at && (
                <span className={`${styles.metaItem} ${styles.expiration}`}>
                  <span className={styles.metaLabel}>{expiryPrefix}</span>
                  <span className={styles.metaValue}>{formatSessionDateTime(session.expires_at)}</span>
                </span>
              )}
            </div>
          </div>
          <div className={styles.sessionOperations}>
            <div className={styles.statusBadge}>
              {session.status === 'active' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span>{session.status}</span>
            </div>
            <div className={styles.sessionActions}>
              <div className={styles.menuWrap} onMouseDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.menuBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId((prev) => (prev === session.id ? null : session.id))
                  }}
                  title="Actions"
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === session.id}
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === session.id && (
                  <div className={styles.menu} role="menu" onClick={(e) => e.stopPropagation()}>
                    {session.status === 'active' && (
                      <>
                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setOpenMenuId(null)
                            handleEdit(session)
                          }}
                          role="menuitem"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setOpenMenuId(null)
                            handleCrewAssignment(session)
                          }}
                          role="menuitem"
                        >
                          <Users size={14} />
                          Assign crew
                        </button>
                        {activeSessionId !== session.id && (
                          <button
                            type="button"
                            className={styles.menuItem}
                            onClick={() => {
                              setOpenMenuId(null)
                              handleSwitchSession(session.id)
                            }}
                            role="menuitem"
                          >
                            <CheckCircle size={14} />
                            Switch to this session
                          </button>
                        )}
                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.dangerItem}`}
                          onClick={() => {
                            setOpenMenuId(null)
                            handleEnd(session.id)
                          }}
                          role="menuitem"
                        >
                          <Square size={14} />
                          End session
                        </button>
                      </>
                    )}

                    {(session.status === 'ended' || session.status === 'expired') && (
                      <>
                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setOpenMenuId(null)
                            handleActivate(session.id)
                          }}
                          role="menuitem"
                        >
                          <Play size={14} />
                          Reactivate
                        </button>
                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.dangerItem}`}
                          onClick={() => {
                            setOpenMenuId(null)
                            handleDelete(session.id)
                          }}
                          role="menuitem"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </>
                    )}

                    {session.status === 'deleted' && (
                      <button
                        type="button"
                        className={styles.menuItem}
                        onClick={() => {
                          setOpenMenuId(null)
                          handleActivate(session.id)
                        }}
                        role="menuitem"
                      >
                        <Play size={14} />
                        Restore
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <div className={styles.listTitleGroup}>
            <div>
              <h3 className={styles.listTitle}>Sessions</h3>
            </div>
            <div className={styles.listSummary} aria-label="Session summary">
              {sessionStats.map((stat) => (
                <span key={stat.label}>
                  <strong>{stat.value}</strong>
                  {stat.label}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.searchControls}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                placeholder="Search flight / route / code..."
                aria-label="Search sessions"
              />
            </div>
            <div className={styles.filterControls}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.multiSelectControls}>
              <button
                type="button"
                className={`${styles.multiSelectBtn} ${showMultiSelect ? styles.active : ''}`}
                onClick={() => setShowMultiSelect(!showMultiSelect)}
                aria-pressed={showMultiSelect}
              >
                <CheckSquare2 size={16} />
                {showMultiSelect ? 'Cancel' : 'Select'}
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
                    Delete
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.createToggleBtn}
              onClick={() => setIsCreatePanelOpen((prev) => !prev)}
            >
              <Plus size={16} />
              {isCreatePanelOpen ? 'Close form' : 'New session'}
            </button>
          </div>
        </div>

        <div className={styles.currentSessionCard}>
          {currentSession ? (
            <>
              <div className={styles.currentSessionHeader}>
                <div>
                  <h4>Currently managing</h4>
                </div>
                <div className={styles.currentSessionBadge}>{currentSession.status}</div>
              </div>
              <div className={styles.currentSessionCommand}>
                <div className={styles.currentSessionInfo}>
                  <div className={styles.currentSessionFlight}>
                    {currentSession.flight_number}
                  </div>
                  <div className={styles.currentSessionRoute}>
                    {currentSession.route || 'Route not set'}
                  </div>
                </div>
                {currentSession.access_code && (
                  <button
                    type="button"
                    className={styles.accessCodePill}
                    onClick={handleCopyAccessCode}
                    title="Copy access code"
                  >
                    <span>Access code</span>
                    <strong>{currentSession.access_code}</strong>
                    <Copy size={15} />
                  </button>
                )}
              </div>
              <div className={styles.currentSessionMeta}>
                <span>
                  <strong>Date</strong>
                  {currentSession.date || 'Not set'}
                </span>
                {currentSession.departure_time && (
                  <span>
                    <strong>Departure</strong>
                    {currentSession.departure_time}
                  </span>
                )}
                {currentSession.expires_at && (
                  <span>
                    <strong>{currentSession.status === 'expired' ? 'Expired' : 'Expires'}</strong>
                    {new Date(currentSession.expires_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className={styles.commandActions}>
                <button
                  type="button"
                  className={styles.secondaryCommandBtn}
                  onClick={() => handleEdit(currentSession)}
                >
                  <Edit size={15} />
                  Edit
                </button>
                {currentSession.status === 'active' && (
                  <>
                    <button
                      type="button"
                      className={styles.secondaryCommandBtn}
                      onClick={() => handleCrewAssignment(currentSession)}
                    >
                      <Users size={15} />
                      Assign crew
                    </button>
                    <button
                      type="button"
                      className={styles.dangerCommandBtn}
                      onClick={() => handleEnd(currentSession.id)}
                    >
                      <Square size={15} />
                      End session
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyCommandPanel}>
              <div>
                <h4>No session selected</h4>
                <p>Create a new flight session or reactivate a past one to start accepting orders.</p>
              </div>
              <button
                type="button"
                className={styles.createToggleBtn}
                onClick={() => setIsCreatePanelOpen(true)}
              >
                <Plus size={16} />
                Create session
              </button>
            </div>
          )}
        </div>

        <div className={styles.instructionCard}>
          <div className={styles.instructionHeader}>
            <h4 className={styles.instructionTitle}>Session Status Guide</h4>
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setIsStatusGuideExpanded(!isStatusGuideExpanded)}
              aria-label={isStatusGuideExpanded ? 'Collapse status guide' : 'Expand status guide'}
              title={isStatusGuideExpanded ? 'Collapse status guide' : 'Expand status guide'}
            >
              {isStatusGuideExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
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
                    <p>Accepts passenger orders and menu changes.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="ended"></div>
                  <div>
                    <strong>Ended</strong>
                    <p>Completed session. Can be reactivated or deleted.</p>
                  </div>
                </div>
                <div className={styles.instructionItem}>
                  <div className={styles.statusIndicator} data-status="expired"></div>
                  <div>
                    <strong>Expired</strong>
                    <p>Past its expiration. Can be reactivated or deleted.</p>
                  </div>
                </div>
              </div>
              <div className={styles.multiSelectInfo}>
                <strong>Multi-select:</strong>
                <p>Select multiple sessions for bulk actions.</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.skeletonList} aria-label="Loading sessions">
            <div className={styles.skeletonRow}></div>
            <div className={styles.skeletonRow}></div>
            <div className={styles.skeletonRow}></div>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle size={28} />
            <h4>No sessions match this view</h4>
            <p>Try another status filter, clear the search, or create a new flight session.</p>
            <button
              type="button"
              className={styles.createToggleBtn}
              onClick={() => setIsCreatePanelOpen(true)}
            >
              <Plus size={16} />
              New session
            </button>
          </div>
        ) : (
          <div className={styles.sessionsList}>
            {statusFilter === 'all' && (
              <>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>Active session</div>
                    <div className={styles.sectionSubTitle}>Only active sessions accept orders.</div>
                  </div>
                  <div className={styles.sectionCount}>{activeSessions.length}</div>
                </div>
                {activeSessions.length === 0 ? (
                  <div className={styles.emptyInline}>No active session right now. Create or reactivate one when cabin service is ready.</div>
                ) : null}
              </>
            )}

            {(statusFilter !== 'all' ? displaySessions : activeSessions).map(renderSessionCard)}

            {statusFilter === 'all' && (
              <>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>Past sessions</div>
                    <div className={styles.sectionSubTitle}>Ended or expired sessions are read-only.</div>
                  </div>
                  <div className={styles.sectionCount}>{pastSessions.length}</div>
                </div>
                {pastSessions.length === 0 ? (
                  <div className={styles.emptyInline}>No past sessions yet.</div>
                ) : null}

                {pastSessions.map(renderSessionCard)}
              </>
            )}
          </div>
        )}

      </div>

      {isCreatePanelOpen && (
        <div className={styles.formCard}>
          <div className={styles.createPanelHeader}>
            <div>
              <h3 className={styles.formTitle}>
                <Plus size={20} />
                Create Flight Session
              </h3>
              <p>Open a flight for passenger access and cabin management.</p>
            </div>
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setIsCreatePanelOpen(false)}
              aria-label="Close create session form"
              title="Close create session form"
            >
              <X size={16} />
            </button>
          </div>

          <>
              <div className={styles.formInstructions}>
                <div className={styles.instructionHeader}>
                  <h4>Session Setup Guide</h4>
                  <button
                    type="button"
                    className={styles.expandButton}
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    aria-label={isFormExpanded ? 'Collapse setup guide' : 'Expand setup guide'}
                    title={isFormExpanded ? 'Collapse setup guide' : 'Expand setup guide'}
                  >
                    {isFormExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
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
                          <p>One flight gets one passenger access code.</p>
                        </div>
                      </div>
                      <div className={styles.instructionItem}>
                        <div className={styles.statusIndicator} data-status="details"></div>
                        <div>
                          <strong>Flight Details</strong>
                          <p>Flight, date, time, and route identify the session.</p>
                        </div>
                      </div>
                      <div className={styles.instructionItem}>
                        <div className={styles.statusIndicator} data-status="manage"></div>
                        <div>
                          <strong>Status</strong>
                          <p>Active sessions accept orders; ended or expired sessions do not.</p>
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

                <div className={styles.formFooter}>
                  <button type="submit" className={styles.submitBtn} disabled={creating}>
                    {creating ? 'Creating...' : 'Create session'}
                  </button>
                </div>
              </form>
          </>
        </div>
      )}

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
