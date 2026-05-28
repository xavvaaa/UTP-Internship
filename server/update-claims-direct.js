import { adminAuth, adminDb } from './firebaseAdmin.js'

async function updateAdminClaims() {
  try {
    console.log('Updating admin user claims...')
    
    // Find the current session with access code HT73Z4LQ
    const sessionsSnapshot = await adminDb
      .collection('flight_sessions')
      .where('access_code', '==', 'HT73Z4LQ')
      .limit(1)
      .get()
    
    if (sessionsSnapshot.empty) {
      console.error('Session not found with access code HT73Z4LQ')
      return
    }
    
    const sessionDoc = sessionsSnapshot.docs[0]
    const sessionId = sessionDoc.id
    console.log('Found session ID:', sessionId)
    
    // Get the admin user by email
    const userRecord = await adminAuth.getUserByEmail('admin@ifmod.com')
    console.log('Found user:', userRecord.email)
    
    // Update custom claims with the session ID
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      flightId: sessionId,
      role: 'admin'
    })
    
    console.log('User claims updated successfully!')
    console.log('Updated flightId claim to:', sessionId)
    console.log('Please log out and log back in to refresh your auth token.')
    
  } catch (error) {
    console.error('Error updating user claims:', error)
  }
}

updateAdminClaims()
