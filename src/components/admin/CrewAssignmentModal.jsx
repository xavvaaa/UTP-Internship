/**
 * Crew Assignment Modal - Select and assign crew members to a session
 */
import { useState, useEffect } from 'react'
import { X, Users, Search, Check } from 'lucide-react'
import { useToast } from '../../context/useToast'
import { getAuthToken } from '../../utils/authToken'
import { assignCrewToSession } from '../../services/flightSessionService'
import styles from './CrewAssignmentModal.module.css'

export default function CrewAssignmentModal({ 
  session, 
  isOpen, 
  onClose, 
  onAssignmentComplete 
}) {
  const { showSuccess, showError } = useToast()
  
  const [crewList, setCrewList] = useState([])
  const [selectedCrewIds, setSelectedCrewIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Initialize selected crew IDs from session data
  useEffect(() => {
    if (session?.assigned_crew_ids) {
      setSelectedCrewIds(session.assigned_crew_ids)
    }
  }, [session])

  // Fetch crew users
  useEffect(() => {
    if (isOpen) {
      fetchCrewUsers()
    }
  }, [isOpen])

  async function fetchCrewUsers() {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users?role=crew`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setCrewList(data.users || [])
      } else {
        showError(data.error || 'Failed to fetch crew users')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to fetch crew users')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignCrew() {
    if (!session?.id) return

    try {
      setAssigning(true)
      const token = await getAuthToken()
      const result = await assignCrewToSession(session.id, selectedCrewIds, token)
      
      if (result.ok) {
        showSuccess('Crew assignment updated successfully')
        onAssignmentComplete?.(result.session)
        onClose()
      } else {
        showError(result.error || 'Failed to assign crew')
      }
    } catch (err) {
      console.error(err)
      showError('Failed to assign crew')
    } finally {
      setAssigning(false)
    }
  }

  function toggleCrewSelection(crewId) {
    setSelectedCrewIds(prev => {
      if (prev.includes(crewId)) {
        return prev.filter(id => id !== crewId)
      } else {
        return [...prev, crewId]
      }
    })
  }

  function handleSelectAll() {
    const filteredCrewIds = filteredCrew.map(crew => crew.id)
    setSelectedCrewIds(filteredCrewIds)
  }

  function handleClearAll() {
    setSelectedCrewIds([])
  }

  const filteredCrew = crewList.filter(crew => 
    crew.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crew.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <Users size={20} />
            <h2>Assign Crew Members</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.sessionInfo}>
          <strong>Session:</strong> {session?.flight_number} - {session?.date}
          {session?.route && <span> ({session.route})</span>}
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search crew by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={handleSelectAll}
              disabled={loading || filteredCrew.length === 0}
            >
              Select All
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={handleClearAll}
              disabled={loading || selectedCrewIds.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className={styles.crewList}>
          {loading ? (
            <div className={styles.loading}>Loading crew members...</div>
          ) : filteredCrew.length === 0 ? (
            <div className={styles.empty}>
              {searchTerm ? 'No crew members found matching your search.' : 'No crew members available.'}
            </div>
          ) : (
            filteredCrew.map((crew) => (
              <div
                key={crew.id}
                className={`${styles.crewItem} ${selectedCrewIds.includes(crew.id) ? styles.selected : ''}`}
                onClick={() => toggleCrewSelection(crew.id)}
              >
                <div className={styles.crewCheckbox}>
                  {selectedCrewIds.includes(crew.id) && <Check size={16} />}
                </div>
                <div className={styles.crewInfo}>
                  <div className={styles.crewName}>{crew.displayName || crew.email}</div>
                  <div className={styles.crewEmail}>{crew.email}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.selectionSummary}>
            {selectedCrewIds.length > 0 && (
              <span>{selectedCrewIds.length} crew member{selectedCrewIds.length !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.assignBtn}
              onClick={handleAssignCrew}
              disabled={assigning || loading}
            >
              {assigning ? 'Assigning...' : 'Assign Crew'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
