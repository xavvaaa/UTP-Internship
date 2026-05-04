import express from 'express'
import { getAuth } from 'firebase-admin/auth'
import { adminDb } from '../firebaseAdmin.js'

const router = express.Router()

// Middleware to verify admin access
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)

    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' })
    }

    req.user = decodedToken
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
}

// Get current flight ID
router.get('/settings/flight', requireAdmin, async (req, res) => {
  try {
    const flightDoc = await adminDb.collection('settings').doc('flight').get()
    const flightId = flightDoc.exists ? flightDoc.data().activeFlightId : process.env.VITE_ACTIVE_FLIGHT_ID || ''
    res.json({ flightId })
  } catch (error) {
    console.error('Error getting flight ID:', error)
    res.status(500).json({ message: 'Failed to get flight ID' })
  }
})

// Update flight ID
router.put('/settings/flight', requireAdmin, async (req, res) => {
  try {
    const { flightId } = req.body
    if (!flightId || typeof flightId !== 'string') {
      return res.status(400).json({ message: 'Valid flight ID required' })
    }

    await adminDb.collection('settings').doc('flight').set({
      activeFlightId: flightId.trim(),
      updatedAt: new Date(),
      updatedBy: req.user.uid
    })

    res.json({ message: 'Flight ID updated successfully' })
  } catch (error) {
    console.error('Error updating flight ID:', error)
    res.status(500).json({ message: 'Failed to update flight ID' })
  }
})

// Get crew members for current flight
router.get('/settings/crew', requireAdmin, async (req, res) => {
  try {
    // Get current flight ID
    const flightDoc = await adminDb.collection('settings').doc('flight').get()
    const activeFlightId = flightDoc.exists ? flightDoc.data().activeFlightId : process.env.VITE_ACTIVE_FLIGHT_ID || ''

    if (!activeFlightId) {
      return res.json({ crew: [] })
    }

    // Get all users with the current flight ID
    const users = await getAuth().listUsers()
    const crew = users.users
      .filter(user => user.customClaims?.flightId === activeFlightId)
      .map(user => ({
        email: user.email,
        role: user.customClaims?.role || 'crew',
        uid: user.uid
      }))

    res.json({ crew })
  } catch (error) {
    console.error('Error getting crew:', error)
    res.status(500).json({ message: 'Failed to get crew members' })
  }
})

// Add crew member
router.post('/settings/crew', requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' })
    }

    if (!['admin', 'crew'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or crew' })
    }

    // Get current flight ID
    const flightDoc = await adminDb.collection('settings').doc('flight').get()
    const activeFlightId = flightDoc.exists ? flightDoc.data().activeFlightId : process.env.VITE_ACTIVE_FLIGHT_ID || ''

    if (!activeFlightId) {
      return res.status(400).json({ message: 'No active flight configured' })
    }

    // Create user
    const user = await getAuth().createUser({
      email,
      password,
      emailVerified: true
    })

    // Set custom claims
    await getAuth().setCustomUserClaims(user.uid, {
      role,
      flightId: activeFlightId
    })

    res.json({ message: 'Crew member added successfully', uid: user.uid })
  } catch (error) {
    console.error('Error adding crew member:', error)

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists' })
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ message: 'Password is too weak' })
    }

    res.status(500).json({ message: 'Failed to add crew member' })
  }
})

// Remove crew member
router.delete('/settings/crew/:email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.params

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Find user by email
    const user = await getAuth().getUserByEmail(email)

    // Delete user
    await getAuth().deleteUser(user.uid)

    res.json({ message: 'Crew member removed successfully' })
  } catch (error) {
    console.error('Error removing crew member:', error)

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ message: 'Crew member not found' })
    }

    res.status(500).json({ message: 'Failed to remove crew member' })
  }
})

export default router