/**
 * User Management Controller
 * Handles user CRUD operations, role assignment, and activation
 */
import { adminDb, adminAuth } from '../firebaseAdmin.js'

/**
 * GET /api/admin/users
 * Get all users
 */
export async function getAllUsers(req, res) {
  try {
    const snapshot = await adminDb.collection('users').get()
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

/**
 * GET /api/users
 * Get users filtered by role (optional)
 */
export async function getUsersByRole(req, res) {
  try {
    const { role } = req.query
    
    let query = adminDb.collection('users')
    if (role && ['admin', 'crew'].includes(role)) {
      query = query.where('role', '==', role)
    }
    
    const snapshot = await query.get()
    const users = snapshot.docs.map((doc) =>({
      id: doc.id,
      ...doc.data(),
    }))

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('Error fetching users by role:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function createUser(req, res) {
  try {
    const { email, password, name, role } = req.body

    // Validation
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }
    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    // Validate role
    if (!['admin', 'crew'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or crew' })
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: email.trim(),
      password,
      displayName: name || email.trim(),
    })

    const userData = {
      uid: userRecord.uid,
      email: email.trim(),
      name: name || email.trim(),
      role,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Set custom claims (role)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role })

    // Store in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set(userData)

    res.status(201).json({
      success: true,
      user: {
        id: userRecord.uid,
        ...userData,
      },
    })
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already exists' })
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
}

/**
 * PUT /api/admin/users/:userId
 * Update user details
 */
export async function updateUser(req, res) {
  try {
    const { userId } = req.params
    const { name, email, role, active } = req.body

    if (!userId?.trim()) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updateData = { updated_at: new Date().toISOString() }

    // Update Firebase Auth if email or name changed
    const authUpdate = {}
    if (email && email !== userSnap.data().email) {
      authUpdate.email = email.trim()
      updateData.email = email.trim()
    }
    if (name) {
      authUpdate.displayName = name
      updateData.name = name
    }

    if (Object.keys(authUpdate).length > 0) {
      await adminAuth.updateUser(userId, authUpdate)
    }

    // Update role if changed
    if (role && ['admin', 'crew'].includes(role) && role !== userSnap.data().role) {
      await adminAuth.setCustomUserClaims(userId, { role })
      updateData.role = role
    }

    // Update active status if provided
    if (active !== undefined) {
      updateData.active = active === true
      // Disable user if inactive
      if (!updateData.active) {
        await adminAuth.updateUser(userId, { disabled: true })
      } else {
        await adminAuth.updateUser(userId, { disabled: false })
      }
    }

    await userRef.update(updateData)

    const updatedSnap = await userRef.get()
    res.json({
      success: true,
      user: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params

    if (!userId?.trim()) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(userId)
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err
      }
    }

    // Delete from Firestore
    await userRef.delete()

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!userId?.trim()) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    if (!role || !['admin', 'crew'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update role in auth
    await adminAuth.setCustomUserClaims(userId, { role })

    // Update in Firestore
    await userRef.update({
      role,
      updated_at: new Date().toISOString(),
    })

    const updatedSnap = await userRef.get()
    res.json({
      success: true,
      user: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ error: 'Failed to update user role' })
  }
}

/**
 * PUT /api/admin/users/:userId/activate
 * Activate/Deactivate user account
 */
export async function toggleUserStatus(req, res) {
  try {
    const { userId } = req.params
    const { active } = req.body

    if (!userId?.trim()) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isActive = active === true
    await adminAuth.updateUser(userId, { disabled: !isActive })
    await userRef.update({
      active: isActive,
      updated_at: new Date().toISOString(),
    })

    const updatedSnap = await userRef.get()
    res.json({
      success: true,
      user: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    })
  } catch (error) {
    console.error('Error toggling user status:', error)
    res.status(500).json({ error: 'Failed to update user status' })
  }
}

/**
 * POST /api/admin/update-claims
 * Update user custom claims (flightId, role)
 */
export async function updateUserClaims(req, res) {
  try {
    const { email, flightId, role } = req.body ?? {}
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email)
    
    // Update custom claims
    const claims = {}
    if (flightId !== undefined) claims.flightId = flightId
    if (role !== undefined) claims.role = role
    
    await adminAuth.setCustomUserClaims(userRecord.uid, claims)
    
    res.json({
      success: true,
      message: 'User claims updated successfully',
      claims
    })
  } catch (error) {
    console.error('Error updating user claims:', error)
    res.status(500).json({ error: 'Failed to update user claims' })
  }
}
