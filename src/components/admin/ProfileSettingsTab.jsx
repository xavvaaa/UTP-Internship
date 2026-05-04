/**
 * Profile Settings Tab - Redesigned
 * Allow users to manage their own profile with improved UX
 */
import { useEffect, useState } from 'react'
import { User, Mail, Lock, Save, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import { auth } from '../../firebase/config'
import { updatePassword, updateProfile } from 'firebase/auth'
import styles from './ProfileSettingsTab.module.css'

export default function ProfileSettingsTab() {
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Profile Settings</h2>
        <p className={styles.subtitle}>Manage your profile information and security settings</p>
      </div>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Profile Information Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Profile Information</h3>
          </div>
          
          <form onSubmit={handleSaveProfile} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <User size={16} className={styles.fieldIcon} />
                  Full Name
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your full name"
                  disabled={savingProfile}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Mail size={16} className={styles.fieldIcon} />
                  Email Address
                </label>
                <input
                  type="email"
                  className={`${styles.input} ${styles.disabledInput}`}
                  value={profileData.email}
                  disabled
                  title="Email cannot be changed"
                />
                <small className={styles.helperText}>Email cannot be changed here</small>
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={savingProfile}
            >
              <Save size={16} className={styles.buttonIcon} />
              {savingProfile ? 'Saving...' : 'Save Profile'}
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
                <span className={styles.statusValue}>{user?.role || 'Crew Member'}</span>
              </div>
              <CheckCircle size={16} className={styles.statusIcon} />
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
          </div>
        </div>

        {/* Security Settings Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <Lock size={20} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Security Settings</h3>
          </div>

          <form onSubmit={handleChangePassword} className={styles.securityForm}>
            <div className={styles.passwordGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Lock size={16} className={styles.fieldIcon} />
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
                  <Lock size={16} className={styles.fieldIcon} />
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
                <small className={styles.helperText}>Minimum 6 characters</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Lock size={16} className={styles.fieldIcon} />
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
              <Lock size={16} className={styles.buttonIcon} />
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
