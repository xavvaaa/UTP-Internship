/**
 * Crew Account Management Tab
 * Features: Edit profile details, Deactivate account, Request account deletion
 * Redesigned for improved usability and visual consistency
 */
import { useState } from 'react'
import { User, Mail, Shield, AlertTriangle, Trash2, Power, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import { auth } from '../../firebase/config'
import styles from './CrewAccountTab.module.css'

export default function CrewAccountTab() {
  const { user, signOut } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  })

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (auth?.currentUser) {
        await auth.currentUser.updateProfile({
          displayName: profileData.displayName,
        })
        showSuccess('Profile updated successfully')
      }
    } catch (error) {
      showError(error?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivateAccount() {
    setLoading(true)
    try {
      // For crew, deactivation means signing out and clearing session
      await signOut()
      showSuccess('Account deactivated successfully')
      setShowDeactivateDialog(false)
    } catch (error) {
      showError(error?.message || 'Failed to deactivate account')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setLoading(true)
    try {
      if (auth?.currentUser) {
        await auth.currentUser.delete()
        showSuccess('Account deletion request submitted')
        setShowDeleteDialog(false)
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        showError('Please sign out and sign back in to delete your account')
      } else {
        showError(error?.message || 'Failed to delete account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Account Management</h2>
        <p className={styles.subtitle}>Manage your crew account settings and preferences</p>
      </div>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Profile Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Profile Information</h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <User size={16} className={styles.fieldIcon} />
                  Display Name
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  placeholder="Enter your display name"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Mail size={16} className={styles.fieldIcon} />
                  Email Address
                </label>
                <input
                  type="email"
                  className={styles.input}
                  value={profileData.email}
                  disabled
                  title="Email cannot be changed here"
                />
                <small className={styles.helperText}>Email cannot be changed here</small>
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading || !profileData.displayName.trim()}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Account Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Account Status</h3>
          </div>
          
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Account Type</span>
                <span className={styles.statusValue}>Crew Member</span>
              </div>
              <CheckCircle size={16} className={styles.statusIcon} />
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Account Status</span>
                <span className={`${styles.statusValue} ${styles.activeStatus}`}>Active</span>
              </div>
              <CheckCircle size={16} className={styles.statusIcon} />
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Last Sign In</span>
                <span className={styles.statusValue}>
                  {user?.metadata?.lastSignInTime ? 
                    new Date(user.metadata.lastSignInTime).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
              <Clock size={16} className={styles.statusIcon} />
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <AlertTriangle size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Account Actions</h3>
          </div>

          <div className={styles.actionsGrid}>
            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <Power size={20} className={styles.actionIcon} />
                <div className={styles.actionDetails}>
                  <h4 className={styles.actionTitle}>Deactivate Account</h4>
                  <p className={styles.actionDescription}>
                    Temporarily disable your account and sign out. You can reactivate it later by signing back in.
                  </p>
                </div>
              </div>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowDeactivateDialog(true)}
                disabled={loading}
              >
                Deactivate
              </button>
            </div>

            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <Trash2 size={20} className={styles.actionIcon} />
                <div className={styles.actionDetails}>
                  <h4 className={styles.actionTitle}>Delete Account</h4>
                  <p className={styles.actionDescription}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                className={styles.dangerButton}
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Deactivate Confirmation Dialog */}
      {showDeactivateDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <Power size={24} className={`${styles.dialogIcon} ${styles.warning}`} />
              <h3>Deactivate Account</h3>
            </div>
            <div className={styles.dialogContent}>
              <p>
                Are you sure you want to deactivate your account? You will be signed out immediately 
                and will need to sign back in to reactivate your account.
              </p>
            </div>
            <div className={styles.dialogActions}>
              <button
                className={`${styles.cancelButton} ${styles.button}`}
                onClick={() => setShowDeactivateDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmDeactivateButton} ${styles.button}`}
                onClick={handleDeactivateAccount}
                disabled={loading}
              >
                {loading ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <Trash2 size={24} className={`${styles.dialogIcon} ${styles.danger}`} />
              <h3>Delete Account</h3>
            </div>
            <div className={styles.dialogContent}>
              <p className={styles.warningText}>
                <strong>Warning:</strong> This action cannot be undone. Deleting your account will:
              </p>
              <ul className={styles.warningList}>
                <li>Permanently remove your account</li>
                <li>Delete all associated data and preferences</li>
                <li>Remove access to flight sessions</li>
                <li>Require admin approval to create a new account</li>
              </ul>
            </div>
            <div className={styles.dialogActions}>
              <button
                className={`${styles.cancelButton} ${styles.button}`}
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmDeleteButton} ${styles.button}`}
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
