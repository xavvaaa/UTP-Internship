/**
 * User Management Sub-Tab
 * Admin interface for managing users, roles, and activation
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Shield, User, Check, X } from 'lucide-react'
import { useToast } from '../../context/useToast'
import { getAuthToken } from '../../utils/authToken'
import {
  getAllUsers,
  createUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from '../../services/admin/adminManagementService'
import styles from './UserManagementTab.module.css'

export default function UserManagementTab() {
  const { showSuccess, showError } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'crew',
  })

  const [editData, setEditData] = useState({
    name: '',
    email: '',
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const result = await getAllUsers(token)

      if (result.ok) {
        setUsers(result.users || [])
      } else {
        showError(result.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      showError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (e) => {
    e.preventDefault()

    if (!formData.email?.trim()) {
      showError('Email is required')
      return
    }
    if (!formData.password) {
      showError('Password is required')
      return
    }

    try {
      setCreating(true)
      const token = await getAuthToken()
      const result = await createUser(formData, token)

      if (result.ok) {
        showSuccess('User created successfully')
        setFormData({ email: '', password: '', name: '', role: 'crew' })
        setShowForm(false)
        await fetchUsers()
      } else {
        showError(result.error || 'Failed to create user')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      showError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateUser = async (userId) => {
    try {
      const token = await getAuthToken()
      const result = await updateUser(userId, editData, token)

      if (result.ok) {
        showSuccess('User updated successfully')
        setEditingId(null)
        await fetchUsers()
      } else {
        showError(result.error || 'Failed to update user')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      showError('Failed to update user')
    }
  }

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'crew' : 'admin'
    try {
      const token = await getAuthToken()
      const result = await updateUserRole(userId, newRole, token)

      if (result.ok) {
        showSuccess(`User role changed to ${newRole}`)
        await fetchUsers()
      } else {
        showError(result.error || 'Failed to update role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      showError('Failed to update role')
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = await getAuthToken()
      const result = await toggleUserStatus(userId, !currentStatus, token)

      if (result.ok) {
        showSuccess(result.user.active ? 'User activated' : 'User deactivated')
        await fetchUsers()
      } else {
        showError(result.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error toggling status:', err)
      showError('Failed to update status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getAuthToken()
      const result = await deleteUser(userId, token)

      if (result.ok) {
        showSuccess('User deleted successfully')
        await fetchUsers()
      } else {
        showError(result.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      showError('Failed to delete user')
    }
  }

  return (
    <div className={styles.container}>
      {/* Create User Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>Add New User</h3>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowForm(false)
                setFormData({ email: '', password: '', name: '', role: 'crew' })
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateUser} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  disabled={creating}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  disabled={creating}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  disabled={creating}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={creating}
                >
                  <option value="crew">Crew</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users List Header */}
      <div className={styles.listHeader}>
        <h3>Users ({users.length})</h3>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className={styles.message}>Loading users...</div>
      ) : users.length === 0 ? (
        <div className={styles.message}>No users yet. Create one to get started.</div>
      ) : (
        <div className={styles.usersList}>
          {users.map((user) => (
            <div key={user.id} className={`${styles.userCard} ${!user.active ? styles.inactive : ''}`}>
              {editingId === user.id ? (
                // Edit Mode
                <div className={styles.editMode}>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Name"
                    className={styles.editInput}
                  />
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    placeholder="Email"
                    className={styles.editInput}
                  />
                  <div className={styles.editActions}>
                    <button
                      className={styles.saveBtn}
                      onClick={() => handleUpdateUser(user.id)}
                    >
                      Save
                    </button>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className={styles.userInfo}>
                    <div className={styles.userHeader}>
                      <span className={styles.userName}>{user.name || user.email}</span>
                      <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {user.role}
                      </span>
                    </div>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>

                  <div className={styles.userActions}>
                    <button
                      className={`${styles.roleBtn} ${user.role === 'admin' ? styles.isAdmin : ''}`}
                      onClick={() => handleToggleRole(user.id, user.role)}
                      title={`Change to ${user.role === 'admin' ? 'Crew' : 'Admin'}`}
                    >
                      <Shield size={16} />
                    </button>

                    <button
                      className={`${styles.statusBtn} ${user.active ? styles.active : styles.inactive}`}
                      onClick={() => handleToggleStatus(user.id, user.active)}
                      title={user.active ? 'Deactivate' : 'Activate'}
                    >
                      {user.active ? <Check size={16} /> : <X size={16} />}
                    </button>

                    <button
                      className={styles.editBtn}
                      onClick={() => {
                        setEditingId(user.id)
                        setEditData({ name: user.name || '', email: user.email })
                      }}
                      title="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
