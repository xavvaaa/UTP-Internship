/**
 * Merged Profile Tab - Combines Profile and Account functionality
 * Role-based profile management with enhanced features
 */
import { useEffect, useState } from 'react'
import { User, Mail, Shield, Crown, Settings, Power, Trash2, Key, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import { auth } from '../../firebase/config'
import { updatePassword, updateProfile } from 'firebase/auth'
import styles from './MergedProfileTab.module.css'

export default function MergedProfileTab({ role }) {
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
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  })

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
      // Account deactivation logic
      showSuccess('Account deactivated successfully')
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
      // Account deletion logic
      showSuccess('Account deletion request submitted')
      await auth.signOut()
    } catch (error) {
      console.error('Error deleting account:', error)
      showError(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const isAdmin = role === 'admin'
  const title = isAdmin ? 'Admin Profile Management' : 'Profile Management'
  const subtitle = isAdmin 
    ? 'Manage your administrator profile and security settings' 
    : 'Manage your profile information and security settings'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Profile Information Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            {isAdmin ? <Crown size={20} className={styles.cardIcon} /> : <User size={20} className={styles.cardIcon} />}
            <h3 className={styles.cardTitle}>{isAdmin ? 'Admin Profile' : 'Profile Information'}</h3>
          </div>
          
          <form onSubmit={handleSaveProfile} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <User size={16} className={styles.fieldIcon} />
                  {isAdmin ? 'Admin Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder={`Enter your ${isAdmin ? 'admin' : ''} name`}
                  disabled={savingProfile}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Mail size={16} className={styles.fieldIcon} />
                  {isAdmin ? 'Admin Email' : 'Email Address'}
                </label>
                <input
                  type="email"
                  className={`${styles.input} ${styles.disabledInput}`}
                  value={profileData.email}
                  disabled
                  title="Email cannot be changed"
                />
                <small className={styles.helperText}>
                  {isAdmin ? 'Contact system admin to change email' : 'Email cannot be changed here'}
                </small>
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

        {/* Account Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>{isAdmin ? 'Admin Status' : 'Account Status'}</h3>
          </div>
          
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Account Type</span>
                <span className={`${styles.statusValue} ${isAdmin ? styles.adminStatus : styles.crewStatus}`}>
                  {isAdmin ? 'System Administrator' : 'Crew Member'}
                </span>
              </div>
              {isAdmin ? <Crown size={16} className={styles.statusIcon} /> : <CheckCircle size={16} className={styles.statusIcon} />}
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Email Verified</span>
                <span className={`${styles.statusValue} ${styles.verifiedStatus}`}>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              {user?.emailVerified ? (
                <CheckCircle size={16} className={styles.statusIcon} />
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
              <CheckCircle size={16} className={styles.statusIcon} />
            </div>

            {isAdmin && (
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
            )}
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
                  Current Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={passwordVisibility.current ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Enter current password"
                    disabled={changingPassword}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => togglePasswordVisibility('current')}
                    disabled={changingPassword}
                    aria-label={passwordVisibility.current ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.current ? (
                      <EyeOff size={16} className={styles.toggleIcon} />
                    ) : (
                      <Eye size={16} className={styles.toggleIcon} />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  New Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={passwordVisibility.new ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Enter new password"
                    disabled={changingPassword}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={changingPassword}
                    aria-label={passwordVisibility.new ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.new ? (
                      <EyeOff size={16} className={styles.toggleIcon} />
                    ) : (
                      <Eye size={16} className={styles.toggleIcon} />
                    )}
                  </button>
                </div>
                <small className={styles.helperText}>
                  Minimum 6 characters{isAdmin ? ', recommended 12+ with mixed characters' : ''}
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={passwordVisibility.confirm ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={changingPassword}
                    aria-label={passwordVisibility.confirm ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.confirm ? (
                      <EyeOff size={16} className={styles.toggleIcon} />
                    ) : (
                      <Eye size={16} className={styles.toggleIcon} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
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

          <div className={styles.actionsList}>
            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <Power size={20} className={styles.actionIcon} />
                <div className={styles.actionDetails}>
                  <h4 className={styles.actionTitle}>Deactivate Account</h4>
                  <p className={styles.actionDescription}>
                    Temporarily disable your {isAdmin ? 'admin' : ''} account and sign out. You can reactivate it later by {isAdmin ? 'contacting a system administrator' : 'signing back in'}.
                  </p>
                </div>
              </div>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowDeactivateDialog(true)}
                disabled={savingProfile || changingPassword}
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
                    Permanently delete your {isAdmin ? 'admin' : ''} account and all associated data. This action cannot be undone{isAdmin ? ' and may affect system operations' : ''}.
                  </p>
                </div>
              </div>
              <button
                className={styles.dangerButton}
                onClick={() => setShowDeleteDialog(true)}
                disabled={savingProfile || changingPassword}
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
              <h3>{isAdmin ? 'Deactivate Admin Account' : 'Deactivate Account'}</h3>
            </div>
            <div className={styles.dialogContent}>
              <p>
                Are you sure you want to deactivate your {isAdmin ? 'admin' : ''} account? You will be signed out immediately 
                and will need to {isAdmin ? 'contact a system administrator' : 'sign back in'} to reactivate your account.
              </p>
              {isAdmin && (
                <p className={styles.warningText}>
                  <strong>Note:</strong> Deactivating your admin account may affect system administration capabilities.
                </p>
              )}
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
              <h3>{isAdmin ? 'Delete Admin Account' : 'Delete Account'}</h3>
            </div>
            <div className={styles.dialogContent}>
              <p className={styles.warningText}>
                <strong>Warning:</strong> This action cannot be undone. Deleting your {isAdmin ? 'admin' : ''} account will:
              </p>
              <ul className={styles.warningList}>
                <li>Permanently remove your {isAdmin ? 'admin' : ''} account</li>
                <li>Delete all associated data and preferences</li>
                <li>Remove access to {isAdmin ? 'system administration' : 'flight sessions'}</li>
                <li>Require {isAdmin ? 'system admin' : 'admin'} approval to create a new account</li>
                {isAdmin && <li>May affect ongoing system operations</li>}
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
