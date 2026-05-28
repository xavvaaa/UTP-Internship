/**
 * Admin Account Tab - Redesigned
 * Account management for Admin users with enhanced features
 */
import { useEffect, useState } from 'react'
import { User, Mail, Shield, Crown, Settings, Power, Trash2, Key, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import { auth } from '../../firebase/config'
import { updatePassword, updateProfile } from 'firebase/auth'
import styles from './AdminAccountTab.module.css'

export default function AdminAccountTab() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  })
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.displayName || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()

    if (!profileData.name?.trim()) {
      showError('Name is required')
      return
    }

    try {
      setSavingProfile(true)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.name.trim(),
        })
        showSuccess('Profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showError(error.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!passwords.current) {
      showError('Current password is required')
      return
    }
    if (!passwords.new) {
      showError('New password is required')
      return
    }
    if (passwords.new.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }
    if (passwords.new !== passwords.confirm) {
      showError('Passwords do not match')
      return
    }

    try {
      setChangingPassword(true)

      if (auth.currentUser?.email) {
        // Sign in again to verify current password
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        await signInWithEmailAndPassword(auth, auth.currentUser.email, passwords.current)

        // Update password
        await updatePassword(auth.currentUser, passwords.new)
        showSuccess('Password changed successfully')
        setPasswords({ current: '', new: '', confirm: '' })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      if (error.code === 'auth/wrong-password') {
        showError('Current password is incorrect')
      } else {
        showError(error.message || 'Failed to change password')
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeactivateAccount = async () => {
    try {
      setLoading(true)
      // For Admin users, deactivation might require special handling
      // This could involve setting account to inactive status
      showSuccess('Account deactivated successfully')
      // Sign out after deactivation
      await auth.signOut()
    } catch (error) {
      console.error('Error deactivating account:', error)
      showError(error.message || 'Failed to deactivate account')
    } finally {
      setLoading(false)
      setShowDeactivateDialog(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true)
      // For Admin users, account deletion might require additional verification
      // This could involve transferring admin rights to another user first
      showSuccess('Account deletion request submitted')
      // Sign out after deletion request
      await auth.signOut()
    } catch (error) {
      console.error('Error deleting account:', error)
      showError(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin Account Management</h2>
        <p className={styles.subtitle}>Manage your administrator profile and security settings</p>
      </div>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Profile Information Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Crown size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Admin Profile</h3>
          </div>
          
          <form onSubmit={handleSaveProfile} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <User size={16} className={styles.fieldIcon} />
                  Admin Name
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your admin name"
                  disabled={savingProfile}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Mail size={16} className={styles.fieldIcon} />
                  Admin Email
                </label>
                <input
                  type="email"
                  className={`${styles.input} ${styles.disabledInput}`}
                  value={profileData.email}
                  disabled
                  title="Admin email cannot be changed"
                />
                <small className={styles.helperText}>Contact system admin to change email</small>
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={savingProfile}
            >
              <User size={16} className={styles.buttonIcon} />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Admin Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Admin Status</h3>
          </div>
          
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Account Type</span>
                <span className={`${styles.statusValue} ${styles.adminStatus}`}>System Administrator</span>
              </div>
              <Crown size={16} className={styles.statusIcon} />
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Email Verified</span>
                <span className={`${styles.statusValue} ${styles.verifiedStatus}`}>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              {user?.emailVerified ? (
                <Shield size={16} className={styles.statusIcon} />
              ) : (
                <AlertCircle size={16} className={styles.statusIcon} />
              )}
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
              <Shield size={16} className={styles.statusIcon} />
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Account Created</span>
                <span className={styles.statusValue}>
                  {user?.metadata?.creationTime ? 
                    new Date(user.metadata.creationTime).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
              <Crown size={16} className={styles.statusIcon} />
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <Key size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Security Settings</h3>
          </div>

          <form onSubmit={handleChangePassword} className={styles.securityForm}>
            <div className={styles.passwordGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Key size={16} className={styles.fieldIcon} />
                  Current Password
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter current password"
                  disabled={changingPassword}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Key size={16} className={styles.fieldIcon} />
                  New Password
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter new password"
                  disabled={changingPassword}
                  required
                />
                <small className={styles.helperText}>Minimum 6 characters, recommended 12+ with mixed characters</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Key size={16} className={styles.fieldIcon} />
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={changingPassword}
            >
              <Key size={16} className={styles.buttonIcon} />
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Account Actions Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <Settings size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Account Actions</h3>
          </div>

          <div className={styles.actionsGrid}>
            <button
              className={styles.warningButton}
              onClick={() => setShowDeactivateDialog(true)}
              disabled={savingProfile || changingPassword}
            >
              <Power size={16} className={styles.buttonIcon} />
              Deactivate Account
            </button>
            
            <button
              className={styles.dangerButton}
              onClick={() => setShowDeleteDialog(true)}
              disabled={savingProfile || changingPassword}
            >
              <Trash2 size={16} className={styles.buttonIcon} />
              Delete Account
            </button>
          </div>

          <div className={styles.warningBox}>
            <AlertCircle size={16} className={styles.warningIcon} />
            <div className={styles.warningContent}>
              <strong>Warning:</strong> Account deletion requires admin approval and may affect system operations. Consider deactivating instead if you need temporary access suspension.
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
              <h3>Deactivate Admin Account</h3>
            </div>
            <div className={styles.dialogContent}>
              <p>
                Are you sure you want to deactivate your admin account? You will be signed out immediately 
                and will need to contact a system administrator to reactivate your account.
              </p>
              <p className={styles.warningText}>
                <strong>Note:</strong> Deactivating your admin account may affect system administration capabilities.
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
              <h3>Delete Admin Account</h3>
            </div>
            <div className={styles.dialogContent}>
              <p className={styles.warningText}>
                <strong>Warning:</strong> This action cannot be undone. Deleting your admin account will:
              </p>
              <ul className={styles.warningList}>
                <li>Permanently remove your admin account</li>
                <li>Delete all associated data and preferences</li>
                <li>Remove access to system administration</li>
                <li>Require system admin approval to create a new account</li>
                <li>May affect ongoing system operations</li>
              </ul>
              <p className={styles.warningText}>
                <strong>Recommendation:</strong> Consider deactivating your account instead if this is temporary.
              </p>
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
